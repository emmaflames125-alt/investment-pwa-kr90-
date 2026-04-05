import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import GrowthHistory from './GrowthHistory';

export default function AdminPanel() {
  const [deposits, setDeposits] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'deposits'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">🔐 Creator Secret Menu</h1>
      <div className="bg-gray-900 rounded-3xl overflow-hidden mb-12">
        <h2 className="text-2xl font-bold p-6 border-b border-gray-800">All Deposits & Gift Cards</h2>
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Gift Type / Method</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map(d => (
              <tr key={d.id} className="border-t border-gray-800">
                <td className="p-4">{d.date?.toDate ? d.date.toDate().toLocaleDateString('en-NG') : '—'}</td>
                <td className="p-4">{d.userEmail}</td>
                <td className="p-4 capitalize">{d.type}</td>
                <td className="p-4 capitalize">{d.giftType || d.type}</td>
                <td className="p-4 text-right font-bold">{d.amount.toLocaleString()} {d.currency || 'USD'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GrowthHistory isAdminView={true} />
    </div>
  );
}