import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_URL = 'http://localhost:3000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [packetStep, setPacketStep] = useState(0); // 0: Client, 1: Toronto, 2: Halifax, 3: Return

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/users/login`, { username, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      addLog(`Logged in as ${res.data.user.username}`);
    } catch (err) {
      addLog(`Login failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/users/register`, { username, password });
      addLog('Registration successful! Please login.');
    } catch (err) {
      addLog(`Registration failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    addLog('Logged out');
  };

  const sendPacket = async () => {
    if (!message) return;
    setIsAnimating(true);
    setPacketStep(0);
    addLog(`Sending packet: "${message}"`);

    try {
      // Animation Step 1: Client -> Toronto
      setPacketStep(1);
      await new Promise(r => setTimeout(r, 1000));

      // Actual API Call
      const res = await axios.post(
        `${API_URL}/dvpn/send`,
        { data: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Animation Step 2: Toronto -> Halifax
      setPacketStep(2);
      addLog('Packet reached Toronto (Relay)');
      await new Promise(r => setTimeout(r, 1000));

      // Animation Step 3: Halifax -> Client (Return)
      setPacketStep(3);
      addLog('Packet reached Halifax (Decrypted)');
      addLog(`Decrypted response: ${JSON.stringify(res.data.fromHalifax.decrypted)}`);
      
      await new Promise(r => setTimeout(r, 1000));
      setPacketStep(0);
      setIsAnimating(false);
      addLog('Response received at Client');

    } catch (err) {
      setIsAnimating(false);
      setPacketStep(0);
      addLog(`Transmission failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!token) {
    return (
      <div className="card">
        <h1>DVPN Access</h1>
        <form>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleRegister}>Register</button>
          </div>
        </form>
        <div className="log-box">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>DVPN Dashboard</h2>
        <div>
          <span>User: {user?.username}</span>
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      </header>

      <div className="node-container">
        <div className="connection-line"></div>
        
        {/* Client Node */}
        <div className={`node ${packetStep === 0 ? 'active' : ''}`}>
          <span>Client</span>
          <div className="status-badge">Origin</div>
        </div>

        {/* Toronto Node */}
        <div className={`node ${packetStep === 1 || packetStep === 3 ? 'active' : ''}`}>
          <span>Toronto</span>
          <div className="status-badge">Relay</div>
        </div>

        {/* Halifax Node */}
        <div className={`node ${packetStep === 2 ? 'active' : ''}`}>
          <span>Halifax</span>
          <div className="status-badge">Decrypt</div>
        </div>

        {/* Animated Packet */}
        {isAnimating && (
          <motion.div 
            className="packet"
            initial={{ left: '10%' }}
            animate={{ 
              left: packetStep === 1 ? '50%' : packetStep === 2 ? '90%' : packetStep === 3 ? '50%' : '10%' 
            }}
            transition={{ duration: 1 }}
          />
        )}
      </div>

      <div className="card">
        <h3>Send Secure Data</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Enter message to encrypt..." 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
          />
          <button onClick={sendPacket} disabled={isAnimating}>
            {isAnimating ? 'Transmitting...' : 'Send Packet'}
          </button>
        </div>
      </div>

      <div className="log-box">
        <h4>Transmission Logs</h4>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}

export default App;
