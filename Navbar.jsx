import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Shield } from 'lucide-react';
import CurrencySelector from './CurrencySelector';

export default function Navbar({ user, isAdmin }) {
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  return (
    <nav className="bg-black border-b border-gray-800 p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold flex items-center gap-2">🌍 Investly</Link>
      {user && (
        <div className="flex items-center gap-6">
          <Link to="/" className="hover:text-emerald-400">Dashboard</Link>
          <Link to="/deposit" className="hover:text-emerald-400">Deposit</Link>
          <Link to="/withdraw" className="hover:text-emerald-400">Withdraw</Link>
          {isAdmin && <Link to="/admin" className="flex items-center gap-1 text-amber-400"><Shield size={18} /> Secret Admin</Link>}
          <CurrencySelector />
          <button onClick={handleLogout} className="flex items-center gap-2 hover:text-red-400"><LogOut size={18} /> Logout</button>
        </div>
      )}
    </nav>
  );
}