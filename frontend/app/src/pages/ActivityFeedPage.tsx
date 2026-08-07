import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Activity, Code, Shield, UploadCloud, GraduationCap, Search, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  user_id: string;
  metadata: any;
  created_at: string;
}

export function ActivityFeedPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const raw = localStorage.getItem('sb-rhmrzusshafmjxcbimpe-auth-token');
        let token = localStorage.getItem('supabase.auth.token') || '';
        if (raw) token = JSON.parse(raw)?.access_token || token;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'auth': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'material': return <UploadCloud className="w-5 h-5 text-green-500" />;
      case 'assessment': return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case 'ai': return <Code className="w-5 h-5 text-indigo-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              Activity Feed
            </h1>
            <p className="text-sm text-slate-500 mt-1">Timeline of platform events across your authorized scope.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search sequence..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow w-full md:w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading timeline...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No recent activity found.</div>
          ) : (
            <div className="relative p-6 before:absolute before:inset-0 before:ml-10 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {logs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 last:mb-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 overflow-hidden z-10 transition-transform group-hover:scale-110">
                    {getIcon(log.type)}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{log.type}</span>
                      <time className="text-xs text-slate-400 font-medium">
                        {new Date(log.created_at).toLocaleString()}
                      </time>
                    </div>
                    <h3 className="text-md font-semibold text-slate-800 mb-1">{log.action}</h3>
                    <pre className="text-xs bg-slate-50 p-2 rounded text-slate-600 mt-3 border border-slate-100 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
