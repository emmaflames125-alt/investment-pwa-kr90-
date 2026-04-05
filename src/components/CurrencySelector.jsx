import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useCurrency } from '../App';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export default function CurrencySelector() {
  const { preferredCurrency, setPreferredCurrency } = useCurrency();
  const handleChange = async (code) => {
    setPreferredCurrency(code);
    if (auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), { preferredCurrency: code });
  };
  return (
    <select value={preferredCurrency} onChange={e => handleChange(e.target.value)} className="bg-gray-800 text-white px-4 py-2 rounded-2xl border border-gray-700 text-sm">
      {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
    </select>
  );
}
