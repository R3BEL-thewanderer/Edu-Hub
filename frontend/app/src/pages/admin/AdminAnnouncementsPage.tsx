import { Bell, Loader2, AlertCircle } from 'lucide-react';
import { useAnnouncements } from '../../api/hooks/useAdmin';

export function AdminAnnouncementsPage() {
  const { data, isLoading, isError } = useAnnouncements();
  const announcements = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase text-black flex items-center gap-3">
            <Bell className="w-8 h-8 text-black" strokeWidth={2.5} /> Announcements
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-1 uppercase">Global alerts, push notifications, and maintenance warnings.</p>
        </div>
        <button className="rounded-none border-4 border-black bg-blue-300 text-black font-black uppercase tracking-wider py-4 px-6 hover:bg-black hover:text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]">
          New Announcement
        </button>
      </div>

      <div className="bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-8 mt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <span className="font-bold uppercase tracking-widest text-gray-500">Loading Announcements...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <span className="font-bold leading-tight uppercase text-red-600">Failed to load Announcements</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-gray-500 font-bold uppercase tracking-widest py-10 border-4 border-dashed border-gray-300">
            No active announcements.
          </div>
        ) : (
          <div className="space-y-4">
             {announcements.map((a: any) => (
                <div key={a.id} className="p-4 border-4 border-black flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                     <h3 className="font-black text-xl uppercase tracking-wider">{a.title}</h3>
                     <span className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">{a.type}</span>
                   </div>
                   <p className="text-gray-700 font-medium">{a.content}</p>
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
