import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <h1>BettingSystem</h1>
          <div className="navbar-nav">
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link to="/bet/new" style={{ color: 'white', textDecoration: 'none' }}>
              Neue Wette
            </Link>
            <Link to="/bets" style={{ color: 'white', textDecoration: 'none' }}>
              Wetten-Historie
            </Link>
            <span style={{ color: '#ccc' }}>|</span>
            <span>{user?.email}</span>
            <button onClick={handleLogout}>Abmelden</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
