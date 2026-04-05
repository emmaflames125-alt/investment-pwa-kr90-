import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import AdminPanel from './components/AdminPanel';
import OfflineBanner from './components/OfflineBanner';

const CurrencyContext = createContext();
export function useCurrency() { return useContext(CurrencyContext); }

const ADMIN_EMAILS = ['YOUR_EMAIL@gmail.com']; // ← CHANGE TO YOUR EMAIL

function App() {
  const [user, setUser] = useState(null);
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  const API_KEY = import.meta.env.VITE_CURRENCY_API_KEY;

  const fetchRates = async () => {
    if (!API_KEY) {
      setExchangeRates({ USD: 1, EUR: 0.92, GBP: 0.78, NGN: 1650, JPY: 150, INR: 83, BRL: 5.6 });
      return;
    }
    try {
      const res = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
      const data = await res.json();
      if (data.result === 'success') setExchangeRates(data.conversion_rates);
    } catch (e) { console.warn("Using fallback rates"); }
  };

  useEffect(() => { fetchRates(); const i = setInterval(fetchRates, 30*60*1000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().preferredCurrency) {
          setPreferredCurrency(snap.data().preferredCurrency);
        } else {
          await setDoc(ref, { balance: 12500, portfolio: [], preferredCurrency: 'USD' }, { merge: true });
        }
      }
      setLoading(false);
    });
  }, []);

  const convertToUserCurrency = (usd) => usd * (exchangeRates[preferredCurrency] || 1);
  const formatCurrency = (amt) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: preferredCurrency, minimumFractionDigits: preferredCurrency === 'JPY' ? 0 : 2
  }).format(convertToUserCurrency(amt));

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Investly...</div>;

  return (
    <CurrencyContext.Provider value={{ preferredCurrency, setPreferredCurrency, formatCurrency, convertToUserCurrency }}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          {!isOnline && <OfflineBanner />}
          <Navbar user={user} isAdmin={isAdmin} />
          <Routes>
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/deposit" element={user ? <Deposit /> : <Navigate to="/login" />} />
            <Route path="/withdraw" element={user ? <Withdraw /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </CurrencyContext.Provider>
  );
}

// Simple LoginPage placeholder
function LoginPage() {
  return <div className="p-8 max-w-md mx-auto text-center">Login / Register with Firebase (use your previous code)</div>;
}

export default App;