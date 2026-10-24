import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, CheckCircle, X, Clock, RefreshCw } from 'lucide-react';
import { viewingApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const statusBadge = {
  REQUESTED: 'orange',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  ATTENDED: 'blue',
  NO_SHOW: 'gray',
  RESCHEDULED: 'orange',
};

export default function Viewings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['viewings'],
    queryFn: () => viewingApi.list(),
    retry: false,
  });

  const viewings = data?.data?.data?.viewings || [];
  const upcoming = viewings.filter((v) => ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(v.status));
  const past = viewings.filter((v) => ['ATTENDED', 'CANCELLED', 'NO_SHOW'].includes(v.status));

  const handleConfirm = async (id) => {
    try { await viewingApi.confirm(id); queryClient.invalidateQueries(['viewings']); } catch {}
  };

  const handleCancel = async (id) => {
    const reason = prompt('Reason for cancellation (optional):');
    try { await viewingApi.cancel(id, reason); queryClient.invalidateQueries(['viewings']); } catch {}
  };

  const ViewingCard = ({ v }) => {
    const isHost = v.hostId === user?.id;
    return (
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm text-charcoal">{v.listing?.title || 'Listing'}</h3>
              <Badge color={statusBadge[v.status] || 'gray'}>{v.status.toLowerCase().replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-clay mb-1">
              <MapPin size={11} />
              {v.listing?.area}, {v.listing?.city}
            </div>
            {(v.confirmedTime || v.proposedTime) && (
              <div className="flex items-center gap-1 text-xs text-charcoal/80 mb-2">
                <Clock size={11} />
                {new Date(v.confirmedTime || v.proposedTime).toLocaleString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'short',
                  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
                })} IST
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-clay">
              <span>{isHost ? 'Seeker: ' : 'Host: '}</span>
              <span className="font-medium text-charcoal">
                {isHost
                  ? `${v.seeker?.firstName} ${v.seeker?.lastName || ''}`
                  : `${v.host?.firstName} ${v.host?.lastName || ''}`}
              </span>
            </div>
            {v.message && <p className="text-xs text-clay italic mt-1">"{v.message}"</p>}
          </div>
          {['REQUESTED', 'RESCHEDULED'].includes(v.status) && isHost && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleConfirm(v.id)} className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                <CheckCircle size={14} />
              </button>
              <button onClick={() => handleCancel(v.id)} className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
          {['REQUESTED', 'CONFIRMED'].includes(v.status) && !isHost && (
            <button onClick={() => handleCancel(v.id)} className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Viewings</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : viewings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No viewings scheduled"
          description="When you request or confirm a viewing, it'll appear here."
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-charcoal mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((v) => <ViewingCard key={v.id} v={v} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-charcoal mb-3 text-clay">Past</h2>
              <div className="space-y-3">
                {past.map((v) => <ViewingCard key={v.id} v={v} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
