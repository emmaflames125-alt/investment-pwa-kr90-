import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useCurrency } from '../App';

const ADMIN_EMAILS = ['YOUR_EMAIL@gmail.com'];
const MIN_WITHDRAW_USD = 200;

export default function Withdraw() {
  const { formatCurrency, convertToUserCurrency, preferredCurrency } = useCurrency();
  const [amount, setAmount] = useState(200);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
  const minInUserCurrency = convertToUserCurrency(MIN_WITHDRAW_USD);

  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(snap => { if (snap.exists()) setBalance(snap.data().balance || 0); });
  }, []);

  const handleWithdraw = async () => {
    if (amount > balance) { alert("Insufficient balance!"); return; }
    if (amount < minInUserCurrency && !isAdmin) {
      alert(`Minimum withdrawal is \]{MIN_WITHDRAW_USD} USD equivalent (${formatCurrency(MIN_WITHDRAW_USD)})`);
      return;
    }
    setLoading(true);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { balance: increment(-amount) });
    alert(`✅ ${formatCurrency(amount)} withdrawn successfully! (Mock)`);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Withdraw Funds</h1>
      <div className="bg-gray-900 rounded-3xl p-8">
        <p className="text-xl mb-2">Current Balance: <span className="font-bold">{formatCurrency(balance)}</span></p>
        <p className="text-amber-400 mb-6">Minimum withdraw: ${MIN_WITHDRAW_USD} USD ({formatCurrency(MIN_WITHDRAW_USD)}) {isAdmin && " — Admin: No minimum"}</p>
        <input type="range" min={minInUserCurrency} max={balance} step="10" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full mb-8 accent-red-500" />
        <div className="text-5xl font-bold mb-8 text-center">{formatCurrency(amount)}</div>
        <button onClick={handleWithdraw} disabled={loading} className="w-full py-6 text-xl font-bold bg-red-600 hover:bg-red-700 rounded-3xl disabled:opacity-50">
          {loading ? 'Processing...' : `Withdraw ${formatCurrency(amount)}`}
        </button>
      </div>
    </div>
  );
}