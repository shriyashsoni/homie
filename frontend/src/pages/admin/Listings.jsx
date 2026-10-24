import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Home, MapPin, Eye, PauseCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const statusBadge = { PUBLISHED: 'green', DRAFT: 'gray', PAUSED: 'orange', FILLED: 'blue', STALE: 'orange', DELETED: 'red' };

export default function AdminListings() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminListings', search, filter, page],
    queryFn: () => adminApi.getListings({ search, status: filter === 'all' ? '' : filter, page, limit: 20 }),
    retry: false,
    keepPreviousData: true,
  });

  const listings = data?.data?.data?.listings || [];
  const total = data?.data?.data?.total || 0;

  const handlePause = async (id) => {
    try {
      await adminApi.updateListing(id, { status: 'PAUSED' });
      queryClient.invalidateQueries(['adminListings']);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-charcoal">Listings</h1>
        <p className="text-xs text-gray-500 mt-0.5">{total} total listings</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Search by title or area…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 flex-wrap">
          {['all', 'PUBLISHED', 'DRAFT', 'STALE', 'PAUSED', 'FILLED'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500'}`}>
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Listing</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Host</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rent</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Last confirmed</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-400">No listings found.</td>
                </tr>
              ) : (
                listings.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🏠</div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-charcoal truncate max-w-[160px]">{l.title}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} /> {l.area}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{l.host?.firstName} {l.host?.lastName}</td>
                    <td className="p-4 text-sm font-semibold text-brand-500">₹{l.rent?.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Badge color={statusBadge[l.status] || 'gray'}>{l.status}</Badge>
                        {l.status === 'STALE' && <AlertTriangle size={12} className="text-orange-500" />}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {l.lastConfirmedAt
                        ? new Date(l.lastConfirmedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : <span className="text-orange-400">Never</span>
                      }
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/listings/${l.id}`} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors" target="_blank">
                          <Eye size={12} />
                        </a>
                        {l.status === 'PUBLISHED' && (
                          <button onClick={() => handlePause(l.id)} className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-200 transition-colors">
                            <PauseCircle size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {Math.min(listings.length, 20)} of {total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={listings.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
