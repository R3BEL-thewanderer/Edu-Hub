import { useState, useMemo } from 'react';
import { Users, Search, Ban, Sparkles, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers, useUpdateUser } from '@/api/hooks/useAdmin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AdminStudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState('');
  
  const { data, isLoading, error } = useUsers(500, 0); // fetching up to 500 users for local filtering
  const updateUser = useUpdateUser();

  const handleToggleAccess = (userId: string, currentStatus: boolean, field: 'is_active' | 'ai_tutor_enabled') => {
    updateUser.mutate(
      { userId, payload: { [field]: !currentStatus } },
      {
        onSuccess: () => toast.success(`User updated successfully`),
        onError: (err: any) => toast.error(err.message || 'Failed to update user')
      }
    );
  };

  const handleEditSubmit = () => {
    if (!editingUserId) return;
    updateUser.mutate(
      { userId: editingUserId, payload: { display_name: editingName, department: editingDepartment || null } },
      {
        onSuccess: () => {
          toast.success('User updated successfully');
          setEditModalOpen(false);
        },
        onError: (err: any) => toast.error(err.message || 'Failed to update user')
      }
    );
  };

  const users = data?.data || [];
  // Filter only students (assuming students don't have super_admin or admin roles, or display all users as requested)
  // According to request, just filter by search
  const filteredUsers = useMemo(() => {
    return users.filter(usr => 
      (usr.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       usr.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!usr.roles.includes('super_admin')) // hide super admins from standard student mangement list
    );
  }, [users, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase text-black">Student Management</h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">View and manage student accounts across all departments.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="SEARCH STUDENTS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black rounded-none font-bold placeholder-gray-400 focus:outline-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase"
          />
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
        <div className="p-4 border-b-4 border-black bg-blue-300 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black" strokeWidth={2.5} />
            <h2 className="font-black text-black uppercase tracking-widest text-lg">Registered Students</h2>
          </div>
          <div className="flex gap-2">
             <Button className="rounded-none border-2 border-black bg-white text-black font-bold uppercase hover:bg-black hover:text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">Filter Dept</Button>
             <Button className="rounded-none border-2 border-black bg-white text-black font-bold uppercase hover:bg-black hover:text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">Filter Year</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-sm font-black text-black uppercase border-b-4 border-black bg-gray-100 tracking-wider">
              <tr>
                <th className="px-6 py-4 border-r-4 border-black">Name & Details</th>
                <th className="px-6 py-4 border-r-4 border-black">Department</th>
                <th className="px-6 py-4 border-r-4 border-black">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black font-bold text-black bg-white uppercase">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-black tracking-widest uppercase">
                    LOADING STUDENTS FROM BACKEND API...
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500 font-black tracking-widest uppercase bg-red-50">
                    Failed to fetch data
                  </td>
                </tr>
              )}
              {!isLoading && !error && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-black tracking-widest uppercase">
                    NO STUDENTS FOUND
                  </td>
                </tr>
              )}
              {!isLoading && !error && filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 border-r-4 border-black">
                    <div className="font-black text-base">{user.full_name || user.display_name || 'UNKNOWN USER'}</div>
                    <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 border-r-4 border-black">
                    <div className="text-black">{user.department || 'UNCATEGORIZED'}</div>
                    <div className="text-xs text-gray-500 mt-1">Batch: {user.admission_batch || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 border-r-4 border-black">
                    <div className="flex flex-col gap-2 items-start">
                      {user.is_active !== false ? (
                        <span className="px-2 py-1 bg-green-300 border-2 border-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)]">ACTIVE</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-300 border-2 border-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)]">BANNED</span>
                      )}
                      {user.ai_tutor_enabled && (
                        <span className="px-2 py-1 flex items-center gap-1 bg-purple-300 border-2 border-black text-[10px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                          <Sparkles className="w-3 h-3" /> AI READY
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                         variant="outline"
                         onClick={() => {
                           setEditingUserId(user.id);
                           setEditingName(user.full_name || user.display_name || '');
                           setEditingDepartment(user.department || '');
                           setEditModalOpen(true);
                         }}
                         title="Edit User Details"
                         className="p-2 h-auto text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-black hover:text-white"
                       >
                         <Edit3 className="w-4 h-4" />
                       </Button>
                       <Button 
                         variant="outline"
                         onClick={() => handleToggleAccess(user.id, user.ai_tutor_enabled, 'ai_tutor_enabled')}
                         title="Toggle AI Tutor"
                         className="p-2 h-auto text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-black hover:text-white"
                       >
                         <Sparkles className="w-4 h-4" />
                       </Button>
                       <Button 
                         variant="outline"
                         onClick={() => handleToggleAccess(user.id, user.is_active !== false, 'is_active')}
                         title="Toggle Account Suspend"
                         className="p-2 h-auto text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-red-500 hover:text-white hover:border-red-500"
                       >
                         <Ban className="w-4 h-4" />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="border-4 border-black rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-widest text-xl">Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-bold uppercase tracking-wider mb-2 block">Display Name</label>
              <Input 
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="border-2 border-black rounded-none font-bold placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-black w-full"
                placeholder="Enter user's new display name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubmit();
                }}
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase tracking-wider mb-2 block">Department</label>
              <Select value={editingDepartment || ''} onValueChange={(val) => setEditingDepartment(val === 'UNCATEGORIZED' ? '' : val)}>
                <SelectTrigger className="border-2 border-black rounded-none font-bold focus:ring-0 focus:ring-offset-0 w-full uppercase">
                  <SelectValue placeholder="SELECT DEPARTMENT" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black rounded-none">
                  <SelectItem value="UNCATEGORIZED" className="font-bold uppercase focus:bg-gray-100 focus:text-black">UNCATEGORIZED</SelectItem>
                  <SelectItem value="CE" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Civil (CE)</SelectItem>
                  <SelectItem value="CSE" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Computer (CSE)</SelectItem>
                  <SelectItem value="ITC" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Information Tech (ITC)</SelectItem>
                  <SelectItem value="EXTC" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Electronics (EXTC)</SelectItem>
                  <SelectItem value="EE" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Electrical (EE)</SelectItem>
                  <SelectItem value="ME" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Mechanical (ME)</SelectItem>
                  <SelectItem value="AI" className="font-bold uppercase focus:bg-gray-100 focus:text-black">Artificial Intelligence (AI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="border-2 border-black rounded-none font-bold uppercase tracking-widest hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={updateUser.isPending}
              className="border-2 border-black rounded-none font-bold uppercase tracking-widest bg-blue-400 text-black hover:bg-blue-500 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
