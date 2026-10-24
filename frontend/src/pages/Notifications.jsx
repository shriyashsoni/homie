import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../api';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

const typeColors = {
  CONNECTION_REQUEST: 'brand',
  CONNECTION_ACCEPTED: 'green',
  VIEWING_REQUEST: 'orange',
  VIEWING_CONFIRMED: 'green',
  VIEWING_REMINDER: 'blue',
  VIEWING_CANCELLED: 'red',
  LISTING_STALE_WARNING: 'orange',
  PROFILE_INCOMPLETE: 'gray',
  SYSTEM: 'gray',
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list(),
    retry: false,
  });

  const notifications = data?.data?.data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      queryClient.invalidateQueries(['notifications']);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      queryClient.invalidateQueries(['notifications']);
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-clay mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} className="flex items-center gap-1.5">
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map((i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You'll see connection requests, viewing updates and other alerts here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card p-4 cursor-pointer transition-all hover:shadow-sm ${!n.isRead ? 'border-l-4 border-l-brand-500' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell size={14} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-charcoal">{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
                    <Badge color={typeColors[n.type] || 'gray'} className="ml-auto flex-shrink-0">
                      {n.type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-clay">{n.body}</p>
                  <p className="text-xs text-clay mt-1">
                    {new Date(n.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
