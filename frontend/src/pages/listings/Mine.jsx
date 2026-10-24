import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Eye, Edit, CheckCircle, PauseCircle, Trash2, RefreshCw } from 'lucide-react';
import { listingApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const statusBadge = { PUBLISHED: 'green', DRAFT: 'gray', PAUSED: 'orange', FILLED: 'blue', STALE: 'orange' };

export default function MyListings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingApi.mine(),
    retry: false,
  });

  const listings = data?.data?.data?.listings || [];

  const handleAction = async (action, id) => {
    try {
      if (action === 'confirm') await listingApi.confirm(id);
      else if (action === 'pause') await listingApi.pause(id);
      else if (action === 'filled') await listingApi.markFilled(id);
      queryClient.invalidateQueries(['myListings']);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Listings</h1>
        <Button onClick={() => navigate('/listings/create')} size="sm" className="flex items-center gap-1.5">
          <PlusCircle size={14} />
          Post a room
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={PlusCircle}
          title="No listings yet"
          description="Post your first room to start receiving applications from compatible flatmates."
          action={<Button onClick={() => navigate('/listings/create')}>Post your first room</Button>}
        />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-brand-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🏠
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-charcoal truncate">{l.title}</h3>
                    <Badge color={statusBadge[l.status] || 'gray'}>{l.status}</Badge>
                  </div>
                  <p className="text-xs text-clay mb-2">{l.area}, {l.city} · ₹{l.rent?.toLocaleString()}/mo</p>
                  {l.status === 'STALE' && (
                    <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                      <RefreshCw size={11} />
                      Needs confirmation — tap to mark as still available
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/listings/${l.id}`)}
                      className="flex items-center gap-1 text-xs text-clay hover:text-charcoal px-2 py-1 rounded-lg hover:bg-sand transition-colors"
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      onClick={() => navigate(`/listings/${l.id}/edit`)}
                      className="flex items-center gap-1 text-xs text-clay hover:text-charcoal px-2 py-1 rounded-lg hover:bg-sand transition-colors"
                    >
                      <Edit size={12} /> Edit
                    </button>
                    {(l.status === 'PUBLISHED' || l.status === 'STALE') && (
                      <button
                        onClick={() => handleAction('confirm', l.id)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle size={12} /> Still available
                      </button>
                    )}
                    {l.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleAction('pause', l.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <PauseCircle size={12} /> Pause
                      </button>
                    )}
                    {l.status !== 'FILLED' && (
                      <button
                        onClick={() => handleAction('filled', l.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <CheckCircle size={12} /> Mark filled
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-500">₹{l.rent?.toLocaleString()}</p>
                  <p className="text-xs text-clay">/month</p>
                  <p className="text-xs text-clay mt-1">{l.viewCount || 0} views</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
