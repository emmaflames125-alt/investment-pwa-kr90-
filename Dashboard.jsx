import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { createChart } from 'lightweight-charts';
import { TrendingUp, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import GrowthHistory from './GrowthHistory';
import { useCurrency } from '../App';

const ADMIN_EMAILS = ['YOUR_EMAIL@gmail.com'];

const stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
];

export default function Dashboard() {
  const { formatCurrency, convertToUserCurrency, preferredCurrency } = useCurrency();
  const [balance, setBalance] = useState(12500);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedStock, setSelectedStock] = useState(stocks[0]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState('');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const isAdmin = auth.currentUser && ADMIN_EMAILS.includes(auth.currentUser.email);
  const MIN_INVEST_USD = 50;

  useEffect(() => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    getDoc(userRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.balance || 12500);
        setPortfolio(data.portfolio || []);
      } else {
        setDoc(userRef, { balance: 12500, portfolio: [], preferredCurrency: 'USD' }, { merge: true });
      }
    });
  }, []);

  const fetchStockData = async (symbol) => {
    const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!API_KEY) { setError("Finnhub API key missing"); return; }
    setLoading(true); setError('');

    try {
      const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=\( {symbol}&token= \){API_KEY}`);
      const quote = await quoteRes.json();
      const usdPrice = quote.c || 0;
      const change = quote.dp || 0;
      setCurrentPrice(convertToUserCurrency(usdPrice));
      setChangePercent(change);

      const to = Math.floor(Date.now() / 1000);
      const from = to - 60 * 86400;
      const candleRes = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=\( {symbol}&resolution=D&from= \){from}&to=\( {to}&token= \){API_KEY}`);
      const candleData = await candleRes.json();

      if (candleData.s === 'ok') {
        const formatted = candleData.t.map((ts, i) => ({
          time: new Date(ts * 1000).toISOString().split('T')[0],
          open: parseFloat(candleData.o[i].toFixed(2)),
          high: parseFloat(candleData.h[i].toFixed(2)),
          low: parseFloat(candleData.l[i].toFixed(2)),
          close: parseFloat(candleData.c[i].toFixed(2))
        }));
        setChartData(formatted);
      }
    } catch (err) {
      setError("Market data unavailable — using cache");
    }
    setLoading(false);
  };

  useEffect(() => { fetchStockData(selectedStock.symbol); }, [selectedStock]);

  useEffect(() => {
    const interval = setInterval(() => { if (navigator.onLine) fetchStockData(selectedStock.symbol); }, 45000);
    return () => clearInterval(interval);
  }, [selectedStock]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;
    if (chartRef.current) chartRef.current.remove();
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: { backgroundColor: '#111827', textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    });
    const candleSeries = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444' });
    candleSeries.setData(chartData);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    return () => { if (chartRef.current) chartRef.current.remove(); };
  }, [chartData]);

  const handleBuy = async () => {
    if (currentPrice <= 0) return;
    if (currentPrice < convertToUserCurrency(MIN_INVEST_USD) && !isAdmin) {
      alert(`Minimum investment is $50 USD equivalent (${formatCurrency(MIN_INVEST_USD)})`);
      return;
    }
    if (balance < currentPrice) { alert("Insufficient balance!"); return; }

    const newBalance = balance - currentPrice;
    const newPortfolio = [...portfolio, { symbol: selectedStock.symbol, name: selectedStock.name, buyPrice: currentPrice, date: new Date().toISOString(), currency: preferredCurrency }];

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { balance: increment(-currentPrice), portfolio: newPortfolio });
    setBalance(newBalance);
    setPortfolio(newPortfolio);
    alert(`✅ Bought 1 share of ${selectedStock.symbol} for ${formatCurrency(currentPrice)}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Live Dashboard</h1>
          <p className="text-emerald-400 text-3xl mt-2 font-mono">{formatCurrency(balance)}</p>
          <p className="text-gray-400">Available Balance</p>
        </div>
        <button onClick={() => fetchStockData(selectedStock.symbol)} disabled={loading} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-2xl disabled:opacity-50">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-2xl mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-400" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {stocks.map(stock => (
          <button key={stock.symbol} onClick={() => setSelectedStock(stock)} className={`p-5 rounded-3xl text-left transition-all ${selectedStock.symbol === stock.symbol ? 'bg-emerald-600 ring-2 ring-emerald-400' : 'bg-gray-900 hover:bg-gray-800'}`}>
            <div className="font-mono text-xl">{stock.symbol}</div>
            <div className="text-sm text-gray-400 truncate">{stock.name}</div>
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-3xl p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-3xl font-bold">{selectedStock.symbol}</div>
            <div className="text-gray-400">{selectedStock.name} • Daily</div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{formatCurrency(currentPrice)}</div>
            <div className={`text-2xl mt-1 flex items-center justify-end gap-1 ${changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {changePercent >= 0 ? '↑' : '↓'} {changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
        {loading && <div className="text-center py-8 text-gray-400">Loading real market data...</div>}
        <div ref={chartContainerRef} className="w-full rounded-2xl overflow-hidden" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-900 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><TrendingUp /> My Portfolio</h2>
          {portfolio.length === 0 ? (
            <p className="text-gray-400 py-12 text-center">No investments yet. Buy using live prices above!</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {portfolio.map((item, i) => (
                <div key={i} className="flex justify-between bg-gray-800 p-5 rounded-3xl">
                  <div>
                    <div className="font-bold">{item.symbol}</div>
                    <div className="text-sm text-gray-400">{item.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(item.buyPrice)}</div>
                    <div className="text-xs text-emerald-400">Bought {new Date(item.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-3xl p-8 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-6">Quick Buy (Live Price)</h2>
          <div className="text-6xl font-bold mb-8 text-center">{formatCurrency(currentPrice)}</div>
          <button onClick={handleBuy} disabled={loading || currentPrice === 0} className="w-full py-8 text-2xl font-bold bg-emerald-600 hover:bg-emerald-700 rounded-3xl disabled:opacity-50 flex items-center justify-center gap-3">
            <Plus size={28} /> Buy 1 Share
          </button>
          <p className="text-center text-sm text-gray-400 mt-6">Minimum: $50 USD equivalent {isAdmin && "(Admin: No limit)"}</p>
        </div>
      </div>

      <GrowthHistory />
    </div>
  );
}