import { Router } from 'express';
import argon2 from 'argon2';
import axios from 'axios';
import crypto from 'crypto';
import { Pool } from 'pg';

interface User {
  id: number;
  email: string;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
}

declare module 'express-session' {
  interface SessionData {
    userId: number;
    email: string;
  }
}

const router = Router();

export default function authRoutes(pool: Pool) {
  
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Passwort muss mindestens 8 Zeichen lang sein');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Passwort muss mindestens eine Zahl enthalten');
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Passwort muss mindestens ein Sonderzeichen (!@#$%^&*) enthalten');
    }
    
    return { valid: errors.length === 0, errors };
  };

  const checkPasswordBreach = async (password: string): Promise<boolean> => {
    try {
      const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);
      
      const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
        timeout: 5000,
      });
      
      const hashes = response.data.split('\n');
      return hashes.some((line: string) => line.startsWith(suffix));
    } catch (error) {
      return false;
    }
  };

  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.errors.join(', ') });
      }

      const isBreached = await checkPasswordBreach(password);
      if (isBreached) {
        return res.status(400).json({ 
          error: 'Dieses Passwort wurde in einem Datenleck gefunden. Bitte wählen Sie ein anderes Passwort.' 
        });
      }

      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'E-Mail bereits registriert' });
      }

      const passwordHash = await argon2.hash(password, {
        timeCost: 2,
        memoryCost: 65536,
        parallelism: 1,
      });

      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );

      const user = result.rows[0];
      req.session.userId = user.id;
      req.session.email = user.email;

      res.status(201).json({ 
        message: 'Benutzer erfolgreich registriert',
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
      }

      const result = await pool.query(
        'SELECT id, email, password_hash, failed_login_attempts, locked_until FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      const user: User = result.rows[0];

      if (user.locked_until && new Date() < user.locked_until) {
        return res.status(423).json({ error: 'Konto ist gesperrt. Versuchen Sie es später erneut.' });
      }

      const isValidPassword = await argon2.verify(user.password_hash, password);

      if (!isValidPassword) {
        const newFailedAttempts = user.failed_login_attempts + 1;
        let lockedUntil: Date | null = null;

        if (newFailedAttempts >= 10) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await pool.query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newFailedAttempts, lockedUntil, user.id]
        );

        return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
        [user.id]
      );

      req.session.userId = user.id;
      req.session.email = user.email;

      res.json({ 
        message: 'Erfolgreich angemeldet',
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Fehler beim Abmelden' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Erfolgreich abgemeldet' });
    });
  });

  router.get('/me', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Nicht angemeldet' });
    }

    res.json({
      user: {
        id: req.session.userId,
        email: req.session.email
      }
    });
  });

  return router;
}
