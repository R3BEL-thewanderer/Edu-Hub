import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url: string;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch token gracefully
  const getToken = () => {
    try {
      const raw = localStorage.getItem('sb-ushmjdcegmhdszrphssp-auth-token') || localStorage.getItem('sb-rhmrzusshafmjxcbimpe-auth-token');
      if (raw) return JSON.parse(raw)?.access_token || '';
    } catch {
      return '';
    }
    // Check fallback
    return localStorage.getItem('supabase.auth.token') || '';
  };

  const fetchUnread = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  useEffect(() => {
    fetchUnread();
    
    // Polling every 60 seconds since we don't have websockets in the frontend yet for notifications
    const interval = setInterval(() => {
      if (!open) fetchUnread();
    }, 60000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  {notifications.length} Unread
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    <p className="mb-2">🎉</p>
                    You're all caught up!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wider">{n.type}</p>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{n.title}</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                            {n.action_url && (
                              <a href={n.action_url} className="text-xs font-medium text-blue-600 hover:underline mt-2 inline-block">
                                View Details &rarr;
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
