import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StationSelection from './components/StationSelection';
import ChargingScreen from './components/ChargingScreen';
import PaymentDue from './components/PaymentDue';
import PaymentSuccess from './components/PaymentSuccess';
import ProfileScreen from './components/ProfileScreen';
import HistoryScreen from './components/HistoryScreen';
import WalletScreen from './components/WalletScreen';
import LoginScreen from './components/LoginScreen';

import { BACKEND_URL, INITIAL_BALANCE } from './data/constants';
import './App.css';

const App = () => {
  const [currentScreen, setScreen] = useState('login');
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [selectedStation, setStation] = useState(null);
  const [balance, setBalance] = useState(INITIAL_BALANCE);

  // Load user data from localStorage
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem('userData');
    const logged = localStorage.getItem('isLoggedIn');
    if (savedUser && logged === 'true') {
      setLoggedIn(true);
      setScreen('stations');
      return JSON.parse(savedUser);
    }
    return null;
  });

  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [currentSession, setSessionData] = useState(null);

  // Handle login
  const handleLogin = (user) => {
    // user should include _id, name, vehicleNo, mobile
    setUserData(user);
    setLoggedIn(true);
    setScreen('stations');

    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  };

  // Handle logout
  const handleLogout = () => {
    setLoggedIn(false);
    setUserData(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('isLoggedIn');
    setScreen('login');
  };

  // Save history whenever updated
  useEffect(() => {
    localStorage.setItem('history', JSON.stringify(history));
  }, [history]);

  // Render screens based on currentScreen
  const renderScreen = () => {
    if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

    switch (currentScreen) {
      case 'stations':
        return (
          <StationSelection
            setScreen={setScreen}
            setStation={setStation}
            userData={userData}
          />
        );
      case 'charging':
        return (
          <ChargingScreen
            station={selectedStation}
            userData={userData}
            setScreen={setScreen}
           setSessionData={setSessionData} 
            currentSession={currentSession}
          />
        );
      case 'payment_due':
        return (
          <PaymentDue
            setScreen={setScreen}
            sessionData={currentSession}
            setBalance={setBalance}
            history={history}
            setHistory={setHistory}
          />
        );
      case 'payment_success':
        return (
          <PaymentSuccess
            setScreen={setScreen}
            sessionData={currentSession}
            balance={balance}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            setScreen={setScreen}
            userData={userData}
            balance={balance}
            setLoggedIn={handleLogout}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            setScreen={setScreen}
            history={history}
            setHistory={setHistory}
          />
        );
      case 'wallet':
        return (
          <WalletScreen
            setScreen={setScreen}
            balance={balance}
            setBalance={setBalance}
          />
        );
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="app-container">
      {isLoggedIn && (
        <Header currentScreen={currentScreen} setScreen={setScreen} balance={balance} />
      )}
      <main className="main-content">{renderScreen()}</main>
      {isLoggedIn && (
        <footer className="footer">
          Made with <span>⚡</span> for EV Charging 
        </footer>
      )}
    </div>
  );
};

export default App;
