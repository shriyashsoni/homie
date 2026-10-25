import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { conversationApi } from '../api';
import EmptyState from '../components/ui/EmptyState';
import { avatarFor } from '../assets/photos';

function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Messages() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationApi.list(),
    retry: false,
    refetchInterval: 15000,
  });

  const conversations = data?.data?.data?.conversations || [];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <p className="section-label mb-1.5">Inbox</p>
        <h1 className="text-2xl md:text-3xl font-black text-charcoal tracking-tight font-display">Messages</h1>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-[72px] rounded-2xl" />)}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description="When you connect with someone, your conversation shows up here. Start by connecting from Discover or Connections."
        />
      ) : (
        <div className="card divide-y divide-charcoal/[0.06] overflow-hidden">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/conversations/${c.id}`)}
              className="w-full flex items-center gap-3 p-4 hover:bg-sand/40 transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <img src={avatarFor(c.other)} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-olive ring-2 ring-card" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-charcoal truncate">
                    {c.other?.firstName} {c.other?.lastName}
                  </p>
                  <span className="text-2xs text-clay flex-shrink-0">{timeAgo(c.updatedAt)}</span>
                </div>
                <p className="text-xs text-clay truncate mt-0.5">
                  {c.lastMessage || 'Say hello to start the conversation'}
                </p>
              </div>
              <ChevronRight size={16} className="text-clay/50 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
