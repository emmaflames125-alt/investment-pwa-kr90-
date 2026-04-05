import { WifiOff } from 'lucide-react';
export default function OfflineBanner() {
  return (
    <div className="bg-amber-600 text-white px-4 py-3 flex items-center gap-3 text-sm font-medium">
      <WifiOff size={18} />
      You are offline — using cached data
      <button onClick={() => window.location.reload()} className="ml-auto bg-white text-amber-600 px-4 py-1 rounded-2xl text-xs font-bold hover:bg-amber-100">Retry Connection</button>
    </div>
  );
}
