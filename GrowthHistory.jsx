import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useCurrency } from '../App';
import { Calendar, TrendingUp } from 'lucide-react';

export default function GrowthHistory({ isAdminView = false }) {
  const { formatCurrency } = useCurrency();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    let q;
    if (isAdminView) {
      q = query(collection(db, 'growth_logs'), orderBy('timestamp', 'desc'));
    } else {
      q = query(collection(db, 'growth_logs'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date()
      }));
      setLogs(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdminView]);

  if (loading) return <div className="text-center py-8">Loading growth history...</div>;

  return (
    <div className="bg-gray-900 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <TrendingUp className="text-emerald-400" /> Growth History
      </h2>
      {logs.length === 0 ? (
        <p className="text-gray-400 py-12 text-center">No growth events yet. Daily multiplier runs at midnight UTC.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="flex justify-between items-center bg-gray-800 p-5 rounded-3xl border-l-4 border-emerald-500">
              <div className="flex items-center gap-4">
                <Calendar size={28} className="text-emerald-400" />
                <div>
                  <div className="font-medium">Balance Doubled (+100%)</div>
                  <div className="text-sm text-gray-400">
                    {log.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">+100% Growth</div>
                <div className="text-sm text-gray-400">
                  {formatCurrency(log.oldBalance)} → {formatCurrency(log.newBalance)}
                </div>
                <div className="text-xs text-gray-500">{log.currency}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}