import { Shield, Settings2, Loader2, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../api/hooks/useAdmin';

export function AdminRolesPage() {
  const { data, isLoading, isError } = usePermissions();
  const permissions = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <Shield className="w-8 h-8 text-black" strokeWidth={2.5} /> Roles & Permissions
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Configure global RBAC rules and endpoint restrictions. Super Admin restricted.</p>
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col mt-6">
         <div className="p-4 border-b-4 border-black bg-orange-300 flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-black" strokeWidth={2.5} />
            <h2 className="font-black text-black uppercase tracking-widest text-lg">Global Scope</h2>
          </div>
          
        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-black" />
              <span className="font-bold uppercase tracking-widest text-gray-500">Loading permissions tree...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <span className="font-bold leading-tight uppercase text-red-600">Failed to load permissions</span>
            </div>
          ) : (
            <div className="space-y-6">
              {permissions.map((node: any) => (
                <div key={node.id} className="border-4 border-black p-4 bg-gray-50 hover:-translate-y-1 transition-transform">
                  <h3 className="text-xl font-black uppercase text-black mb-1">{node.role}</h3>
                  <p className="text-gray-700 font-bold mb-3">{node.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {node.allowed_features.map((feature: string, idx: number) => (
                      <span key={idx} className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
