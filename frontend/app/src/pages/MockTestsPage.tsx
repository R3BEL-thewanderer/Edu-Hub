import { useState, useEffect } from 'react';
import { PlayCircle, Clock } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function MockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const raw = localStorage.getItem('sb-ushmjdcegmhdszrphssp-auth-token') || localStorage.getItem('sb-rhmrzusshafmjxcbimpe-auth-token');
        let token = localStorage.getItem('supabase.auth.token') || '';
        if (raw) token = JSON.parse(raw)?.access_token || token;

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/assessment/tests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setTests(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-8">
          Available Mock Tests
        </h1>
        
        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading assessments...</div>
        ) : tests.length === 0 ? (
          <div className="text-center bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No tests available</h3>
            <p className="text-slate-500 text-sm">Check back later for upcoming mock assessments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => (
              <div key={test.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-slate-800">{test.title}</h3>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                    {test.department_id || 'GENERAL'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-6 line-clamp-2">{test.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <Clock className="w-4 h-4 mr-1" />
                    {test.duration_minutes} mins
                  </div>
                  <button className="flex items-center gap-2 bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <PlayCircle className="w-4 h-4" /> Start Attempt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
