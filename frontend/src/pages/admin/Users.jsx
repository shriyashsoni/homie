import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield, Mail, Phone, Calendar } from 'lucide-react';
import { adminApi } from '../../api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { avatarFor } from '../../assets/photos';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, filter, page],
    queryFn: () => adminApi.getUsers({ search, role: filter === 'all' ? '' : filter, page, limit: 20 }),
    retry: false,
    keepPreviousData: true,
  });

  const users = data?.data?.data?.users || [];
  const total = data?.data?.data?.total || 0;

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await adminApi.deactivateUser(user.id);
      } else {
        await adminApi.activateUser(user.id);
      }
      queryClient.invalidateQueries(['adminUsers']);
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleMakeAdmin = async (user) => {
    try {
      await adminApi.updateUser(user.id, { isAdmin: !user.isAdmin });
      queryClient.invalidateQueries(['adminUsers']);
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-charcoal">Users</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          {['all', 'SEEKER', 'HOST', 'ADMIN'].map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500'}`}>
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-48 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-20 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-16 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-24 animate-pulse" /></td>
                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={avatarFor(u)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-charcoal">
                            {u.firstName} {u.lastName}
                            {u.isAdmin && <Shield size={12} className="inline ml-1 text-brand-500" />}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge color={u.role === 'HOST' ? 'blue' : u.role === 'ADMIN' ? 'brand' : 'gray'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-600">{u.isActive ? 'Active' : 'Deactivated'}</span>
                        {u.emailVerified && <Mail size={11} className="text-green-500" />}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="text-xs text-brand-500 font-medium hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Showing {Math.min(users.length, 20)} of {total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Manage User">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <img src={avatarFor(selectedUser)} alt="" className="w-12 h-12 rounded-2xl object-cover" />
              <div>
                <p className="font-bold text-charcoal">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
                <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Role</p>
                <p className="font-medium">{selectedUser.role}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <p className={`font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedUser.isActive ? 'Active' : 'Deactivated'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Email verified</p>
                <p className="font-medium">{selectedUser.emailVerified ? '✓ Yes' : '✗ No'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Admin</p>
                <p className="font-medium">{selectedUser.isAdmin ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant={selectedUser.isActive ? 'danger' : 'primary'}
                size="sm"
                className="w-full"
                onClick={() => handleToggleActive(selectedUser)}
              >
                {selectedUser.isActive ? <><UserX size={14} /> Deactivate account</> : <><UserCheck size={14} /> Reactivate account</>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleMakeAdmin(selectedUser)}
              >
                <Shield size={14} />
                {selectedUser.isAdmin ? 'Remove admin access' : 'Grant admin access'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
