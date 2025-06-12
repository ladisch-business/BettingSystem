import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { Pool } from 'pg';
import authRoutes from '../routes/auth';

const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
}));

const mockPool = {
  query: jest.fn(),
} as unknown as Pool;

app.use('/auth', authRoutes(mockPool));

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com' }] });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'UniqueTestPass2024!@#',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Benutzer erfolgreich registriert');
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Passwort muss mindestens');
    });

    it('should reject duplicate email', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'UniqueTestPass2024!@#',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('E-Mail bereits registriert');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'UniqueTestPass2024!@#',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Ungültige Anmeldedaten');
    });

    it('should reject invalid credentials', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Ungültige Anmeldedaten');
    });
  });
});
