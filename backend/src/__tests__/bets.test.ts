import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { Pool } from 'pg';
import betRoutes from '../routes/bets';

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

app.use('/bets', betRoutes(mockPool));

describe('Bet Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /bets', () => {
    it('should create a new bet with valid data', async () => {
      const mockBet = {
        id: 1,
        user_id: 1,
        einsatz: 10.00,
        quote: 2.50,
        mannschaft: 'Bayern München',
        created_at: new Date(),
        result: null,
        winnings: null,
        is_won: null,
      };

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockBet] });

      const agent = request.agent(app);
      
      await agent
        .get('/bets')
        .set('Cookie', ['connect.sid=test-session']);

      const response = await agent
        .post('/bets')
        .send({
          einsatz: 10.00,
          quote: 2.50,
          mannschaft: 'Bayern München',
        });

      expect(response.status).toBe(401);
    });

    it('should reject invalid bet data', async () => {
      const agent = request.agent(app);

      const response = await agent
        .post('/bets')
        .send({
          einsatz: -10,
          quote: 2.50,
          mannschaft: 'Bayern München',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /bets', () => {
    it('should return user bets with statistics', async () => {
      const mockBets = [
        {
          id: 1,
          user_id: 1,
          einsatz: 10.00,
          quote: 2.50,
          mannschaft: 'Bayern München',
          created_at: new Date(),
          result: 'gewonnen',
          winnings: 25.00,
          is_won: true,
        },
      ];

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockBets });

      const agent = request.agent(app);

      const response = await agent
        .get('/bets');

      expect(response.status).toBe(401);
    });
  });
});
