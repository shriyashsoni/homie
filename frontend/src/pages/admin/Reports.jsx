import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, CheckCircle, X, AlertTriangle, Search } from 'lucide-react';
import { adminApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const statusBadge = { OPEN: 'orange', UNDER_REVIEW: 'blue', RESOLVED: 'green', DISMISSED: 'gray' };
const typeBadge = { SPAM: 'gray', FAKE_LISTING: 'red', HARASSMENT: 'red', PAYMENT_SCAM: 'red', IMPERSONATION: 'orange', OFFENSIVE_CONTENT: 'orange', OTHER: 'gray' };

export default function AdminReports() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminReports', filter, page],
    queryFn: () => adminApi.getReports({ status: filter === 'all' ? '' : filter, page, limit: 20 }),
    retry: false,
    keepPreviousData: true,
  });

  const reports = data?.data?.data?.reports || [];
  const total = data?.data?.data?.total || 0;

  const handleResolve = async (id, status) => {
    try {
      await adminApi.updateReport(id, { status, adminNote });
      queryClient.invalidateQueries(['adminReports']);
      setSelected(null);
      setAdminNote('');
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-charcoal">Reports</h1>
        <p className="text-xs text-gray-500 mt-0.5">{total} {filter === 'all' ? 'total' : filter.toLowerCase()} reports</p>
      </div>

      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
        {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'all'].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500'}`}>
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Report</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reporter</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-gray-400">
                    {filter === 'OPEN' ? '✓ No open reports' : 'No reports found.'}
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Flag size={14} className={r.status === 'OPEN' ? 'text-red-500' : 'text-gray-400'} />
                        <p className="text-sm text-charcoal truncate max-w-[160px]">
                          {r.description?.substring(0, 50) || 'No description'}{r.description?.length > 50 ? '…' : ''}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge color={typeBadge[r.reportType] || 'gray'}>
                        {r.reportType?.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {r.reportedBy?.firstName} {r.reportedBy?.lastName}
                    </td>
                    <td className="p-4">
                      <Badge color={statusBadge[r.status] || 'gray'}>{r.status?.toLowerCase()}</Badge>
                    </td>
                    <td className="p-4 text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => { setSelected(r); setAdminNote(r.adminNote || ''); }}
                        className="text-xs text-brand-500 font-medium hover:underline">
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {Math.min(reports.length, 20)} of {total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={reports.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Report detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Report" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Badge color={typeBadge[selected.reportType] || 'gray'}>
                  {selected.reportType?.replace(/_/g, ' ')}
                </Badge>
                <Badge color={statusBadge[selected.status] || 'gray'}>{selected.status}</Badge>
              </div>
              <p className="text-sm text-charcoal">{selected.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Reported by</p>
                <p className="font-medium text-charcoal">{selected.reportedBy?.firstName} {selected.reportedBy?.lastName}</p>
                <p className="text-xs text-gray-400">{selected.reportedBy?.email}</p>
              </div>
              {selected.reportedUser && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Reported user</p>
                  <p className="font-medium text-charcoal">{selected.reportedUser?.firstName} {selected.reportedUser?.lastName}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Admin note</label>
              <textarea
                className="input-field h-20 resize-none"
                placeholder="Internal note (not visible to users)…"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {selected.status === 'OPEN' && (
                <Button size="sm" variant="secondary" onClick={() => handleResolve(selected.id, 'UNDER_REVIEW')} className="flex-1">
                  Mark under review
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleResolve(selected.id, 'RESOLVED')}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={14} /> Resolve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleResolve(selected.id, 'DISMISSED')}
                className="flex items-center gap-1.5"
              >
                <X size={14} /> Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
