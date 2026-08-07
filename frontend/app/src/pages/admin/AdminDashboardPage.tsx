import { Users, FileStack, Activity, ArrowUpRight, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useDashboardStats } from '@/api/hooks/useAdmin';

export function AdminDashboardPage() {
  const { data: stats, isLoading: loading, error, refetch, isRefetching } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Overview
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">
            Real-time platform metrics and status.
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={loading || isRefetching}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black hover:bg-black hover:text-white transition-all text-sm font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw className={`w-4 h-4 ${(loading || isRefetching) ? 'animate-spin' : ''}`} strokeWidth={3} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-400 border-4 border-black text-black font-bold uppercase rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          {error.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Card 1 */}
        <div className="p-6 rounded-none bg-blue-300 border-4 border-black relative overflow-hidden group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <Users className="w-16 h-16 text-black" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-black/80">Total Users</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black text-black">{loading ? '-' : stats?.totalUsers || 0}</span>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-black border-2 border-black bg-white w-fit px-3 py-1 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <ArrowUpRight className="w-4 h-4 mr-1" strokeWidth={3} />
            Registered
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-none bg-emerald-300 border-4 border-black relative overflow-hidden group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <ShieldCheck className="w-16 h-16 text-black" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-black/80">Active Staff</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black text-black">{loading ? '-' : stats?.activeStaff || 0}</span>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-black border-2 border-black bg-white w-fit px-3 py-1 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <ArrowUpRight className="w-4 h-4 mr-1" strokeWidth={3} />
            Privileged Roles
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-none bg-yellow-300 border-4 border-black relative overflow-hidden group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <FileStack className="w-16 h-16 text-black" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-black/80">Indexed Files</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black text-black">{loading ? '-' : stats?.totalFiles || 0}</span>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-black border-2 border-black bg-white w-fit px-3 py-1 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            Across all subjects
          </div>
        </div>
        
        {/* Card 5 (Active Traffic) */}
        <div className="p-6 rounded-none bg-orange-300 border-4 border-black relative overflow-hidden group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <Activity className="w-16 h-16 text-black" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-black/80">Active Traffic</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-black text-black">{loading ? '-' : stats?.activeTraffic || 0}</span>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-black border-2 border-black bg-white w-fit px-3 py-1 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <ArrowUpRight className="w-4 h-4 mr-1" strokeWidth={3} />
            Last 15 Mins
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-6 rounded-none bg-green-300 border-4 border-black relative overflow-hidden group hover:-translate-y-1 transition-transform shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <RefreshCcw className="w-16 h-16 text-black" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-black/80">System Status</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-black text-black uppercase tracking-tighter">{loading ? '-' : stats?.status || 'OFFLINE'}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-black bg-white border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <span>Scan: {loading ? '-' : new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
      
      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="p-6 bg-white border-4 border-black min-h-[300px] flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase text-xl mb-2 tracking-wide">Revenue Analytics</h3>
          <p className="text-sm font-bold text-gray-500 uppercase">Chart rendering engine not available</p>
        </div>
        <div className="p-6 bg-white border-4 border-black min-h-[300px] flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase text-xl mb-2 tracking-wide">User Growth</h3>
          <p className="text-sm font-bold text-gray-500 uppercase">Chart rendering engine not available</p>
        </div>
      </div>
    </div>
  );
}
