import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Bet {
  id: number;
  einsatz: number;
  quote: number;
  mannschaft: string;
  created_at: string;
  result: string | null;
  winnings: number | null;
  is_won: boolean | null;
}

interface Statistics {
  totalBets: number;
  totalStake: number;
  totalWinnings: number;
  profit: number;
  profitPercentage: string;
}

const BetHistory: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingBet, setUpdatingBet] = useState<number | null>(null);

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
  });

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      const response = await api.get('/bets');
      setBets(response.data.bets);
      setStatistics(response.data.statistics);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const updateBetResult = async (betId: number, result: string) => {
    setUpdatingBet(betId);
    try {
      await api.put(`/bets/${betId}/result`, { result });
      await fetchBets();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fehler beim Aktualisieren der Wette');
    } finally {
      setUpdatingBet(null);
    }
  };

  const deleteBet = async (betId: number) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Wette löschen möchten?')) {
      return;
    }

    try {
      await api.delete(`/bets/${betId}`);
      await fetchBets();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Fehler beim Löschen der Wette');
    }
  };

  if (loading) {
    return <div>Laden...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1>Wetten-Historie</h1>
      
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statistics.totalBets}</div>
            <div className="stat-label">Gesamte Wetten</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">€{statistics.totalStake.toFixed(2)}</div>
            <div className="stat-label">Gesamter Einsatz</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">€{statistics.totalWinnings.toFixed(2)}</div>
            <div className="stat-label">Gesamte Gewinne</div>
          </div>
          <div className="stat-card">
            <div 
              className="stat-value" 
              style={{ color: statistics.profit >= 0 ? '#28a745' : '#dc3545' }}
            >
              €{statistics.profit.toFixed(2)}
            </div>
            <div className="stat-label">
              Gewinn/Verlust ({statistics.profitPercentage}%)
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Alle Wetten</h2>
        
        {bets.length === 0 ? (
          <p>Noch keine Wetten vorhanden.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Mannschaft</th>
                  <th>Einsatz</th>
                  <th>Quote</th>
                  <th>Potentieller Gewinn</th>
                  <th>Status</th>
                  <th>Tatsächlicher Gewinn</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => (
                  <tr key={bet.id}>
                    <td>{new Date(bet.created_at).toLocaleDateString('de-DE')}</td>
                    <td>{bet.mannschaft}</td>
                    <td>€{bet.einsatz.toFixed(2)}</td>
                    <td>{bet.quote.toFixed(2)}</td>
                    <td>€{(bet.einsatz * bet.quote).toFixed(2)}</td>
                    <td>
                      {bet.result === null ? (
                        <span style={{ color: '#ffc107' }}>Offen</span>
                      ) : bet.is_won ? (
                        <span style={{ color: '#28a745' }}>Gewonnen</span>
                      ) : (
                        <span style={{ color: '#dc3545' }}>Verloren</span>
                      )}
                    </td>
                    <td>
                      {bet.winnings !== null ? (
                        <span style={{ color: bet.winnings > 0 ? '#28a745' : '#dc3545' }}>
                          €{bet.winnings.toFixed(2)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {bet.result === null ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => updateBetResult(bet.id, 'gewonnen')}
                            disabled={updatingBet === bet.id}
                          >
                            {updatingBet === bet.id ? '...' : 'Gewonnen'}
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => updateBetResult(bet.id, 'verloren')}
                            disabled={updatingBet === bet.id}
                          >
                            {updatingBet === bet.id ? '...' : 'Verloren'}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          onClick={() => deleteBet(bet.id)}
                        >
                          Löschen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetHistory;
