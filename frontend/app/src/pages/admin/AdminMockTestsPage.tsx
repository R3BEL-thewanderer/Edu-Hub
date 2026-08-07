import { FileText, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMockTests } from '../../api/hooks/useAdmin';

export function AdminMockTestsPage() {
  const { data, isLoading, isError } = useMockTests();
  const tests = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <FileText className="w-8 h-8 text-black" strokeWidth={2.5} /> Mock Tests Engine
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Manage mock tests, question banks, and view leaderboard results.</p>
        </div>
        <Button className="rounded-none border-4 border-black bg-green-400 text-black font-black uppercase tracking-wider py-6 px-6 hover:bg-black hover:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex gap-2">
          <PlusCircle className="w-5 h-5" strokeWidth={3} /> Create Test
        </Button>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] mt-6 p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <span className="font-bold uppercase tracking-widest text-gray-500">Loading Mock Tests overview...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <span className="font-bold leading-tight uppercase text-red-600">Failed to load mock tests</span>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center font-bold text-gray-500 uppercase tracking-widest">
            No mock tests found.
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test: any) => (
              <div key={test.id} className="flex items-center justify-between p-4 border-4 border-black bg-white hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-black">{test.title}</h3>
                  <p className="text-gray-600 font-bold uppercase mt-1 text-sm">{test.questions_count} Questions • {test.participants_count} Participants</p>
                </div>
                <div className="flex items-center gap-4">
                   <span className={`px-4 py-2 border-2 border-black font-black uppercase text-xs tracking-widest ${test.status === 'Active' ? 'bg-green-300 text-black' : 'bg-gray-200 text-gray-500'}`}>
                     {test.status}
                   </span>
                   <Button variant="outline" className="border-4 border-black rounded-none font-black uppercase hover:bg-black hover:text-white">
                      Manage
                   </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
