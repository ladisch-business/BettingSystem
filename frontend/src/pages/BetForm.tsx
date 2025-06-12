import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BetForm: React.FC = () => {
  const [einsatz, setEinsatz] = useState('');
  const [quote, setQuote] = useState('');
  const [mannschaft, setMannschaft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const einsatzNum = parseFloat(einsatz);
      const quoteNum = parseFloat(quote);

      if (einsatzNum <= 0) {
        setError('Einsatz muss größer als 0 sein');
        return;
      }

      if (quoteNum <= 0) {
        setError('Quote muss größer als 0 sein');
        return;
      }

      if (!mannschaft.trim()) {
        setError('Mannschaft ist erforderlich');
        return;
      }

      await api.post('/bets', {
        einsatz: einsatzNum,
        quote: quoteNum,
        mannschaft: mannschaft.trim(),
      });

      navigate('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const potentialWinnings = einsatz && quote ? (parseFloat(einsatz) * parseFloat(quote)).toFixed(2) : '0.00';

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h1>Neue Wette erstellen</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mannschaft">Mannschaft</label>
            <input
              type="text"
              id="mannschaft"
              value={mannschaft}
              onChange={(e) => setMannschaft(e.target.value)}
              placeholder="z.B. Bayern München"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="einsatz">Einsatz (€)</label>
            <input
              type="number"
              id="einsatz"
              value={einsatz}
              onChange={(e) => setEinsatz(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="quote">Quote</label>
            <input
              type="number"
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="1.50"
              step="0.01"
              min="1.01"
              required
              disabled={loading}
            />
          </div>

          {einsatz && quote && (
            <div className="card" style={{ backgroundColor: '#f8f9fa', marginBottom: '20px' }}>
              <h3>Wetten-Übersicht</h3>
              <p><strong>Mannschaft:</strong> {mannschaft || 'Nicht angegeben'}</p>
              <p><strong>Einsatz:</strong> €{parseFloat(einsatz || '0').toFixed(2)}</p>
              <p><strong>Quote:</strong> {parseFloat(quote || '0').toFixed(2)}</p>
              <p><strong>Potentieller Gewinn:</strong> €{potentialWinnings}</p>
              <p><strong>Potentieller Profit:</strong> €{(parseFloat(potentialWinnings) - parseFloat(einsatz || '0')).toFixed(2)}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Erstellen...' : 'Wette erstellen'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BetForm;
