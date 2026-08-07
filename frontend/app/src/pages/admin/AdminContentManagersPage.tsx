import { useState, useMemo } from 'react';
import { UserCog, Filter, UserRoundCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers, useRevokeRole, useAssignRole } from '@/api/hooks/useAdmin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function AdminContentManagersPage() {
  const [modalSearch, setModalSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useUsers(500, 0);
  const revokeRole = useRevokeRole();
  const assignRole = useAssignRole();

  const users = data?.data || [];
  
  const assignableUsers = useMemo(() => {
    return users.filter(u => 
      !u.roles.includes('content_manager') && 
      !u.roles.includes('super_admin') &&
      (u.display_name?.toLowerCase().includes(modalSearch.toLowerCase()) || 
       u.email?.toLowerCase().includes(modalSearch.toLowerCase()))
    );
  }, [users, modalSearch]);
  const managers = useMemo(() => {
    return users.filter(usr => usr.roles.includes('content_manager'));
  }, [users]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <UserCog className="w-8 h-8 text-black" strokeWidth={2.5} /> Content Managers
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Manage delegates assigned to upload content for specific departments.</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none border-4 border-black bg-purple-400 text-black font-black uppercase tracking-wider py-6 px-6 hover:bg-black hover:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-none border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-white">
            <DialogHeader>
              <DialogTitle className="font-black uppercase text-xl text-black">Select User to Grant Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" strokeWidth={3} />
                <Input 
                  placeholder="SEARCH USERS..." 
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-9 rounded-none border-2 border-black focus-visible:ring-0 font-bold uppercase text-xs"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto border-2 border-black divide-y-2 divide-black">
                {assignableUsers.length === 0 ? (
                  <div className="p-4 text-center font-bold text-xs uppercase text-gray-500 bg-gray-50">No matching users found</div>
                ) : (
                  assignableUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 hover:bg-purple-50 transition-colors">
                      <div>
                        <div className="font-black text-sm uppercase">{u.full_name || u.display_name || 'UNKNOWN'}</div>
                        <div className="text-xs font-bold text-gray-500">{u.email}</div>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={assignRole.isPending}
                        className="rounded-none border-2 border-black font-bold uppercase text-xs hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" 
                        onClick={() => {
                          assignRole.mutate({ userId: u.id as string, role: 'content_manager' }, {
                            onSuccess: () => {
                              setModalSearch('');
                              setModalOpen(false);
                            }
                          });
                        }}
                      >
                        {assignRole.isPending ? 'WAIT...' : 'GRANT'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col mt-6">
         <div className="p-4 border-b-4 border-black bg-purple-300 flex justify-between items-center">
            <h2 className="font-black text-black uppercase tracking-widest text-lg">Active Managers</h2>
            <Button className="rounded-none border-2 border-black bg-white text-black font-bold uppercase hover:bg-black hover:text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-2">
               <Filter className="w-4 h-4" strokeWidth={3} /> Department
            </Button>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-sm font-black text-black uppercase border-b-4 border-black bg-gray-100 tracking-wider">
              <tr>
                <th className="px-6 py-4 border-r-4 border-black">Manager</th>
                <th className="px-6 py-4 border-r-4 border-black">Department Assigment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black font-bold text-black bg-white uppercase">
              {isLoading && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-black tracking-widest uppercase">
                    LOADING MANAGERS...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-red-500 font-black tracking-widest uppercase bg-red-50">
                    Failed to fetch data
                  </td>
                </tr>
              )}
              {!isLoading && !error && managers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 font-black tracking-widest uppercase">
                    NO CONTENT MANAGERS FOUND
                  </td>
                </tr>
              )}
              {!isLoading && !error && managers.map((user) => (
                <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-6 py-4 border-r-4 border-black flex items-center gap-3">
                    <UserRoundCheck className="w-6 h-6 text-black" strokeWidth={2} />
                    <div>
                      <div className="font-black text-base">{user.full_name || user.display_name || 'UNKNOWN USER'}</div>
                      <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-r-4 border-black">
                    {user.department || 'GLOBAL'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline"
                      className="rounded-none border-2 border-black text-xs font-black uppercase hover:bg-black hover:text-white"
                      disabled={revokeRole.isPending}
                      onClick={() => revokeRole.mutate({ userId: user.id as string, role: 'content_manager' })}
                    >
                      {revokeRole.isPending ? 'Working...' : 'Revoke'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
