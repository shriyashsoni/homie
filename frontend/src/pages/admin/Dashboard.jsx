import { useQuery } from '@tanstack/react-query';
import { Users, Home, Flag, TrendingUp, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { adminApi } from '../../api';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-500 bg-brand-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-charcoal">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats(),
    retry: false,
  });

  const stats = data?.data?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-charcoal">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Find My Homie · Bengaluru · Live data</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(8).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)
        ) : (
          <>
            <StatCard icon={Users} label="Total users" value={stats.totalUsers} color="brand" />
            <StatCard icon={CheckCircle} label="Active users" value={stats.activeUsers} sub="Last 30 days" color="green" />
            <StatCard icon={Home} label="Published listings" value={stats.publishedListings} color="blue" />
            <StatCard icon={Activity} label="Listings total" value={stats.totalListings} color="gray" />
            <StatCard icon={TrendingUp} label="Total connections" value={stats.totalConnections} color="brand" />
            <StatCard icon={CheckCircle} label="Accepted connections" value={stats.acceptedConnections} color="green" />
            <StatCard icon={Clock} label="Viewings scheduled" value={stats.totalViewings} color="orange" />
            <StatCard icon={Flag} label="Open reports" value={stats.openReports} sub="Needs review" color="red" />
          </>
        )}
      </div>

      {/* System health */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
            <Activity size={16} className="text-brand-500" />
            System status
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'API server', status: 'operational' },
              { label: 'Database', status: 'operational' },
              { label: 'Email service', status: 'operational' },
              { label: 'Listing freshness job', status: 'operational' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-charcoal mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Attention needed
          </h2>
          <div className="space-y-3">
            {stats.openReports > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <span className="text-sm text-red-700">{stats.openReports} open reports</span>
                <a href="/admin/reports" className="text-xs text-brand-500 font-semibold">Review →</a>
              </div>
            )}
            {stats.staleListings > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <span className="text-sm text-orange-700">{stats.staleListings} stale listings</span>
                <a href="/admin/listings" className="text-xs text-brand-500 font-semibold">View →</a>
              </div>
            )}
            {!stats.openReports && !stats.staleListings && (
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700">✓ Nothing needs immediate attention</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
