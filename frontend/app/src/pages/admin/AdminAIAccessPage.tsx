import { useState } from 'react';
import { Sparkles, KeySquare, Loader2, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers, useUpdateUser } from '../../api/hooks/useAdmin';

export function AdminAIAccessPage() {
  const { data, isLoading, isError } = useUsers(500, 0);
  const updateMutation = useUpdateUser();
  const [searchTerm, setSearchTerm] = useState('');

  const users = data?.data || [];
  
  const students = users.filter((u: any) => 
    !u.roles?.includes('admin') && !u.roles?.includes('super_admin')
  );

  const filteredStudents = students.filter((user: any) => 
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleToggle = (userId: string, currentState: boolean) => {
    updateMutation.mutate({ userId, payload: { ai_tutor_enabled: !currentState } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-black" strokeWidth={2.5} /> AI Tutor Entitlements
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Manage which students have access to the AI Chat Tutor (<code className="bg-black text-white px-1.5 py-0.5 ml-1">ai_tutor_enabled</code>).</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" strokeWidth={2.5} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="SEARCH STUDENTS..."
            className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black rounded-none font-bold placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase"
          />
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col mt-6">
        <div className="p-4 border-b-4 border-black bg-yellow-300 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <KeySquare className="w-6 h-6 text-black" strokeWidth={2.5} />
            <h2 className="font-black text-black uppercase tracking-widest text-lg">Manage Access</h2>
          </div>
        </div>
        
        <div className="p-8">
           {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <span className="font-bold uppercase tracking-widest text-gray-500">Loading AI Access list...</span>
            </div>
           ) : isError ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <span className="font-bold leading-tight uppercase text-red-600">Failed to load users</span>
            </div>
           ) : (
             <div className="space-y-4">
               {filteredStudents.length === 0 ? (
                 <div className="text-center py-10 font-bold uppercase tracking-widest text-gray-500">
                   NO STUDENTS FOUND
                 </div>
               ) : (
                 filteredStudents.map((user: any) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-4 border-black bg-white hover:bg-gray-50 transition-colors gap-4">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-wider text-black">{user.full_name || user.display_name || 'UNKNOWN USER'}</h3>
                        <p className="text-gray-600 font-bold mt-1 text-sm">{user.email}</p>
                      </div>
                      <div>
                         <Button 
                           onClick={() => handleToggle(user.id, !!user.ai_tutor_enabled)}
                           disabled={updateMutation.isPending}
                           className={`border-4 border-black rounded-none font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] w-full sm:w-auto ${user.ai_tutor_enabled ? 'bg-red-400 text-black hover:bg-red-500' : 'bg-green-400 text-black hover:bg-green-500'}`}
                         >
                            {user.ai_tutor_enabled ? 'Revoke Access' : 'Grant Access'}
                         </Button>
                      </div>
                    </div>
                 ))
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
