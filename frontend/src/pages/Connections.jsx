import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Link2, MessageCircle, CheckCircle, X, Clock } from 'lucide-react';
import { connectionApi } from '../api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { avatarFor } from '../assets/photos';

const statusBadge = {
  PENDING: 'orange',
  ACCEPTED: 'green',
  DECLINED: 'red',
  CANCELLED: 'gray',
  BLOCKED: 'red',
};

export default function Connections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionApi.list(),
    retry: false,
  });

  const connections = data?.data?.data?.connections || [];

  const handleAccept = async (id) => {
    try {
      await connectionApi.accept(id);
      queryClient.invalidateQueries(['connections']);
    } catch {}
  };

  const handleDecline = async (id) => {
    try {
      await connectionApi.decline(id);
      queryClient.invalidateQueries(['connections']);
    } catch {}
  };

  const pending = connections.filter((c) => c.status === 'PENDING');
  const accepted = connections.filter((c) => c.status === 'ACCEPTED');
  const others = connections.filter((c) => !['PENDING', 'ACCEPTED'].includes(c.status));

  const ConnectionCard = ({ conn }) => {
    const other = conn.sender || conn.receiver || {};
    const otherName = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Member';
    return (
      <div className="card p-4 hover:shadow-card-hover transition-all duration-200">
        <div className="flex items-start gap-3">
          <img src={avatarFor(other)} alt={otherName} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-semibold text-sm text-charcoal">{otherName}</p>
              <Badge color={statusBadge[conn.status] || 'gray'}>{conn.status.toLowerCase()}</Badge>
            </div>
            {conn.listing && <p className="text-xs text-clay">Re: {conn.listing.title}</p>}
            {conn.message && (
              <p className="text-xs text-charcoal/80 mt-1.5 bg-sand/60 rounded-xl px-3 py-2 leading-relaxed">"{conn.message}"</p>
            )}
            <p className="text-2xs text-clay mt-1.5 flex items-center gap-1">
              <Clock size={10} />
              {new Date(conn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {conn.status === 'PENDING' && (
              <>
                <button onClick={() => handleAccept(conn.id)} title="Accept"
                  className="w-9 h-9 bg-olive/12 text-olive rounded-full flex items-center justify-center hover:bg-olive hover:text-white transition-colors">
                  <CheckCircle size={15} />
                </button>
                <button onClick={() => handleDecline(conn.id)} title="Decline"
                  className="w-9 h-9 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center hover:bg-brand-500 hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </>
            )}
            {conn.status === 'ACCEPTED' && conn.conversation && (
              <button onClick={() => navigate(`/conversations/${conn.conversation.id}`)} title="Message"
                className="w-9 h-9 bg-brand-500 text-white rounded-full flex items-center justify-center hover:bg-brand-600 transition-colors">
                <MessageCircle size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="page-title">Connections</h1>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : connections.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No connections yet"
          description="When someone sends you a connection request or you send one, it'll appear here."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                Pending requests
                <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center">{pending.length}</span>
              </h2>
              <div className="space-y-3">
                {pending.map((c) => <ConnectionCard key={c.id} conn={c} />)}
              </div>
            </div>
          )}

          {accepted.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-charcoal mb-3">Connected</h2>
              <div className="space-y-3">
                {accepted.map((c) => <ConnectionCard key={c.id} conn={c} />)}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-clay mb-3">Past requests</h2>
              <div className="space-y-3">
                {others.map((c) => <ConnectionCard key={c.id} conn={c} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
