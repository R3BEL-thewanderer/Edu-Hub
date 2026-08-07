import { BookOpen, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingMaterials, useApproveMaterial, useRejectMaterial } from '@/api/hooks/useMaterials';
import { toast } from 'sonner';

export function AdminMaterialsPage() {
  const { data: pending, isLoading, error } = usePendingMaterials();
  const approveMutation = useApproveMaterial();
  const rejectMutation = useRejectMaterial();

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success('Material approved successfully'),
      onError: (err: any) => toast.error(err.message || 'Failed to approve material')
    });
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id, {
      onSuccess: () => toast.success('Material rejected'),
      onError: (err: any) => toast.error(err.message || 'Failed to reject material')
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-black" strokeWidth={2.5} /> Study Materials
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Directly upload and manage files in Supabase Storage.</p>
        </div>
        <Button className="rounded-none border-4 border-black bg-blue-300 text-black font-black uppercase tracking-wider py-6 px-6 hover:bg-black hover:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">Upload Material</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col">
          <div className="p-4 border-b-4 border-black bg-yellow-300">
           <h3 className="text-xl font-black uppercase text-black flex items-center gap-2">
             <Clock className="w-5 h-5 text-black" strokeWidth={2.5} /> Pending Approvals
           </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-sm font-black text-black uppercase border-b-4 border-black bg-gray-100 tracking-wider">
                <tr>
                   <th className="px-4 py-3 border-r-4 border-black">File Path</th>
                   <th className="px-4 py-3 border-r-4 border-black">Submitted By</th>
                   <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black font-bold text-black uppercase">
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 tracking-widest">LOADING PENDING QUEUE...</td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-red-500 tracking-widest bg-red-50">API ERROR</td>
                  </tr>
                )}
                {!isLoading && !error && (!pending || pending.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 tracking-widest">
                       ALL CAUGHT UP! NO PENDING MATERIALS.
                    </td>
                  </tr>
                )}
                {!isLoading && pending?.map(mat => (
                  <tr key={mat.id} className="hover:bg-yellow-50">
                    <td className="px-4 py-3 border-r-4 border-black truncate max-w-[200px]" title={mat.storage_path}>
                      {mat.storage_path.split('/').pop() || 'Unknown File'}
                      <div className="text-[10px] text-gray-500 mt-1 truncate">{mat.change_summary}</div>
                    </td>
                    <td className="px-4 py-3 border-r-4 border-black">{mat.uploaded_by}</td>
                    <td className="px-4 py-3 text-right">
                       <div className="flex justify-end gap-2">
                         <Button 
                           variant="outline"
                           onClick={() => handleApprove(mat.id)}
                           className="p-2 h-auto text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-green-500 hover:text-white hover:border-green-500"
                           title="Approve"
                         >
                           <Check className="w-4 h-4" />
                         </Button>
                         <Button 
                           variant="outline"
                           onClick={() => handleReject(mat.id)}
                           className="p-2 h-auto text-black border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-red-500 hover:text-white hover:border-red-500"
                           title="Reject"
                         >
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-6 self-start">
           <h3 className="text-xl font-black uppercase text-black mb-4">Storage Usage</h3>
           <div className="w-full bg-white border-2 border-black h-4 mb-3">
             <div className="bg-blue-400 h-full border-r-2 border-black animate-pulse" style={{ width: '45%' }}></div>
           </div>
           <p className="text-xs font-black uppercase tracking-widest text-black flex justify-between">
             <span>Usage stats</span>
             <span>14 GB / 50 GB</span>
           </p>
        </div>
      </div>
    </div>
  );
}
