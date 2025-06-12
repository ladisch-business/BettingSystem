import { Router } from 'express';
import { Pool } from 'pg';

interface Bet {
  id: number;
  user_id: number;
  einsatz: number;
  quote: number;
  mannschaft: string;
  created_at: Date;
  result: string | null;
  winnings: number | null;
  is_won: boolean | null;
}

const router = Router();

export default function betRoutes(pool: Pool) {
  
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Anmeldung erforderlich' });
    }
    next();
  };

  router.post('/', requireAuth, async (req, res) => {
    try {
      const { einsatz, quote, mannschaft } = req.body;
      const userId = req.session.userId;

      if (!einsatz || !quote || !mannschaft) {
        return res.status(400).json({ error: 'Einsatz, Quote und Mannschaft sind erforderlich' });
      }

      if (einsatz <= 0 || quote <= 0) {
        return res.status(400).json({ error: 'Einsatz und Quote müssen größer als 0 sein' });
      }

      const result = await pool.query(
        'INSERT INTO bets (user_id, einsatz, quote, mannschaft) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, einsatz, quote, mannschaft]
      );

      const bet = result.rows[0];
      res.status(201).json({ 
        message: 'Wette erfolgreich erstellt',
        bet 
      });
    } catch (error) {
      console.error('Create bet error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.get('/', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      const result = await pool.query(
        'SELECT * FROM bets WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const bets = result.rows.map(bet => ({
        ...bet,
        einsatz: parseFloat(bet.einsatz),
        quote: parseFloat(bet.quote),
        winnings: bet.winnings ? parseFloat(bet.winnings) : null
      }));
      const totalBets = bets.length;
      const totalStake = bets.reduce((sum, bet) => sum + bet.einsatz, 0);
      const totalWinnings = bets.reduce((sum, bet) => sum + (bet.winnings || 0), 0);
      const profit = totalWinnings - totalStake;

      res.json({
        bets,
        statistics: {
          totalBets,
          totalStake,
          totalWinnings,
          profit,
          profitPercentage: totalStake > 0 ? ((profit / totalStake) * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Get bets error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.put('/:id/result', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { result } = req.body;
      const userId = req.session.userId;

      if (!result) {
        return res.status(400).json({ error: 'Ergebnis ist erforderlich' });
      }

      const betResult = await pool.query(
        'SELECT * FROM bets WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (betResult.rows.length === 0) {
        return res.status(404).json({ error: 'Wette nicht gefunden' });
      }

      const bet: Bet = betResult.rows[0];
      const isWon = result.toLowerCase() === 'gewonnen';
      const winnings = isWon ? bet.einsatz * bet.quote : 0;

      const updateResult = await pool.query(
        'UPDATE bets SET result = $1, is_won = $2, winnings = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [result, isWon, winnings, id, userId]
      );

      res.json({
        message: 'Wettenergebnis erfolgreich aktualisiert',
        bet: updateResult.rows[0]
      });
    } catch (error) {
      console.error('Update bet result error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.get('/:id/winnings', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const result = await pool.query(
        'SELECT einsatz, quote, winnings, is_won FROM bets WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Wette nicht gefunden' });
      }

      const bet = result.rows[0];
      const potentialWinnings = bet.einsatz * bet.quote;

      res.json({
        einsatz: bet.einsatz,
        quote: bet.quote,
        potentialWinnings,
        actualWinnings: bet.winnings || 0,
        isWon: bet.is_won
      });
    } catch (error) {
      console.error('Get winnings error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const result = await pool.query(
        'DELETE FROM bets WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Wette nicht gefunden' });
      }

      res.json({ message: 'Wette erfolgreich gelöscht' });
    } catch (error) {
      console.error('Delete bet error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  return router;
}
