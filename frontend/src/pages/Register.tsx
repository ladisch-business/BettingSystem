import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import CryptoJS from 'crypto-js';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [breachWarning, setBreachWarning] = useState('');
  const { register } = useAuth();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Mindestens 8 Zeichen');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Mindestens ein Großbuchstabe');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Mindestens ein Kleinbuchstabe');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Mindestens eine Zahl');
    }
    
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Mindestens ein Sonderzeichen (!@#$%^&*)');
    }
    
    return errors;
  };

  const checkPasswordBreach = async (password: string): Promise<boolean> => {
    try {
      const hash = CryptoJS.SHA1(password).toString().toUpperCase();
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

  const handlePasswordChange = async (newPassword: string) => {
    setPassword(newPassword);
    const errors = validatePassword(newPassword);
    setPasswordErrors(errors);

    if (errors.length === 0 && newPassword.length > 0) {
      const isBreached = await checkPasswordBreach(newPassword);
      if (isBreached) {
        setBreachWarning('⚠️ Dieses Passwort wurde in einem Datenleck gefunden. Wählen Sie ein anderes Passwort.');
      } else {
        setBreachWarning('');
      }
    } else {
      setBreachWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Bitte beheben Sie die Passwort-Anforderungen');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Registrieren</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              disabled={loading}
            />
            {passwordErrors.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#dc3545' }}>
                <strong>Passwort-Anforderungen:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {breachWarning && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#dc3545' }}>
                {breachWarning}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading || passwordErrors.length > 0}
          >
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Bereits ein Konto? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
