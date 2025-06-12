import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const Dashboard: React.FC = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const recentBets = bets.slice(0, 5);

  return (
    <div>
      <h1>Dashboard</h1>
      
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Aktuelle Wetten</h2>
          <Link to="/bet/new" className="btn btn-primary">
            Neue Wette
          </Link>
        </div>

        {recentBets.length === 0 ? (
          <p>Noch keine Wetten vorhanden. <Link to="/bet/new">Erstellen Sie Ihre erste Wette</Link>.</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Mannschaft</th>
                  <th>Einsatz</th>
                  <th>Quote</th>
                  <th>Potentieller Gewinn</th>
                  <th>Status</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {recentBets.map((bet) => (
                  <tr key={bet.id}>
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
                    <td>{new Date(bet.created_at).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {bets.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/bets" className="btn btn-secondary">
                  Alle Wetten anzeigen
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
