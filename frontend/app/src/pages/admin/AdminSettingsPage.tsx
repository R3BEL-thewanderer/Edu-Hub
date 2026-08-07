import { Settings } from 'lucide-react';
import { useSystemSettings, useUpdateSettings, type SystemSettings } from '@/api/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AdminSettingsPage() {
  const { data: settings, isLoading, isError } = useSystemSettings();
  const updateMutation = useUpdateSettings();

  const handleToggle = (key: keyof SystemSettings) => {
    if (!settings) return;
    
    updateMutation.mutate(
      { [key]: !settings[key] },
      {
        onSuccess: () => toast.success('Settings updated successfully'),
        onError: (err: any) => toast.error(err.message || 'Failed to update settings')
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <Settings className="w-8 h-8 text-black" strokeWidth={2.5} /> Platform Settings
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Maintenance mode toggles, registration overrides, and global app configuration.</p>
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-8 mt-6">
        {isLoading && (
          <div className="text-center font-bold tracking-widest uppercase">LOADING SETTINGS...</div>
        )}
        {isError && (
          <div className="text-center text-red-500 font-bold tracking-widest uppercase bg-red-50 p-4 border-2 border-red-500">
            FAILED TO LOAD SETTINGS
          </div>
        )}
        
        {!isLoading && !isError && settings && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <div>
                <h3 className="font-black text-xl uppercase tracking-widest">Maintenance Mode</h3>
                <p className="text-gray-500 text-sm font-bold mt-1">Disables access to the platform for all non-super-admins.</p>
              </div>
              <Button 
                onClick={() => handleToggle('maintenanceMode')}
                className={`rounded-none border-4 border-black font-black uppercase tracking-wider py-4 px-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${settings.maintenanceMode ? 'bg-red-400 text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
              >
                {settings.maintenanceMode ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <div>
                <h3 className="font-black text-xl uppercase tracking-widest">Registration Open</h3>
                <p className="text-gray-500 text-sm font-bold mt-1">Allow new users to sign up vs invite-only.</p>
              </div>
              <Button 
                onClick={() => handleToggle('registrationOpen')}
                className={`rounded-none border-4 border-black font-black uppercase tracking-wider py-4 px-6 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] ${settings.registrationOpen ? 'bg-green-400 text-black' : 'bg-gray-300 text-black border-dashed'}`}
              >
                {settings.registrationOpen ? 'OPEN' : 'CLOSED'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
