import { Database, Server, BrainCircuit, HardDrive, ShieldAlert } from 'lucide-react';
import { useSystemHealth } from '@/api/hooks/useAdmin';

export function AdminHealthPage() {
  const { data: health, isLoading } = useSystemHealth();

  const getStatusColor = (status?: string) => {
    if (status === 'online') return 'bg-green-400 text-black border-black';
    if (isLoading) return 'bg-gray-300 text-gray-700 border-black animate-pulse';
    return 'bg-red-400 text-black border-black';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-black" strokeWidth={2.5} /> System Diagnostics
        </h1>
        <p className="text-sm font-bold text-gray-600 mt-1 uppercase">
          Verify the connectivity and health of all microservices and databases.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        
        {/* Core API */}
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center border-4 border-black bg-blue-300 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Server className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-black uppercase tracking-widest text-lg">Core API</p>
              <p className="text-xs font-bold text-gray-500 uppercase">FastAPI Backend</p>
            </div>
          </div>
          <div className="flex justify-start">
            <span className={`px-3 py-1 font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm ${getStatusColor(health?.api)}`}>
              {health?.api?.toUpperCase() || 'CHECKING'}
            </span>
          </div>
        </div>

        {/* PostgreSQL Database */}
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center border-4 border-black bg-purple-300 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <Database className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-black uppercase tracking-widest text-lg">SQL DB</p>
              <p className="text-xs font-bold text-gray-500 uppercase">Supabase Connection</p>
            </div>
          </div>
          <div className="flex justify-start">
            <span className={`px-3 py-1 font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm ${getStatusColor(health?.database)}`}>
              {health?.database?.toUpperCase() || 'CHECKING'}
            </span>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center border-4 border-black bg-yellow-300 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <HardDrive className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-black uppercase tracking-widest text-lg">Storage</p>
              <p className="text-xs font-bold text-gray-500 uppercase">Study Materials</p>
            </div>
          </div>
          <div className="flex justify-start">
            <span className={`px-3 py-1 font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm ${getStatusColor(health?.storage)}`}>
              {health?.storage?.toUpperCase() || 'CHECKING'}
            </span>
          </div>
        </div>

        {/* AI Service */}
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center border-4 border-black bg-pink-300 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
              <BrainCircuit className="w-6 h-6 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-black uppercase tracking-widest text-lg">AI Tutor</p>
              <p className="text-xs font-bold text-gray-500 uppercase">NVIDIA NIM Cloud</p>
            </div>
          </div>
          <div className="flex justify-start">
            <span className={`px-3 py-1 font-black uppercase tracking-widest border-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-sm ${getStatusColor(health?.ai_service)}`}>
              {health?.ai_service?.toUpperCase() || 'CHECKING'}
            </span>
          </div>
        </div>

      </div>

      {/* Backend Logs Section */}
      <div className="mt-8 bg-black text-green-400 p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] font-mono text-sm h-64 overflow-y-auto">
        <h2 className="text-white font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-5 h-5 text-green-400" />
          Backend Error Logs
        </h2>
        {health?.recent_errors && health.recent_errors.length > 0 ? (
          health.recent_errors.slice().reverse().map((err, i) => (
            <div key={i} className="mb-2 border-b border-gray-800 pb-2">
              <span className="text-gray-500">[{new Date(err.timestamp).toLocaleTimeString()}]</span>{' '}
              <span className="text-red-400 font-bold">[{err.level}]</span>{' '}
              <span className="text-gray-300 whitespace-pre-wrap">{err.message}</span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No recent backend errors recorded.</div>
        )}
      </div>
    </div>
  );
}
