'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, AlertTriangle, Clock, FileText, CheckCircle } from 'lucide-react';
import { StatusBadge, formatDate, isSLABreached, ProductLabel, LoadingSpinner } from '@/components/ui/shared';

export function MarketingDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setMetrics(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketing Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {session?.user?.name}</p>
        </div>
        <Link href="/submissions/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Submission
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Submissions" value={metrics?.total ?? 0} icon={<FileText className="w-5 h-5 text-blue-600" />} />
        <MetricCard label="Drafts" value={metrics?.drafts ?? 0} icon={<Clock className="w-5 h-5 text-gray-400" />} />
        <MetricCard label="Pending Information" value={metrics?.pendingInfo ?? 0} icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} highlight={metrics?.pendingInfo > 0} />
        <MetricCard label="SLA Breach" value={metrics?.slaBreach ?? 0} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} highlight={metrics?.slaBreach > 0} danger />
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Submissions</h2>
          <Link href="/submissions" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {metrics?.recent?.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No submissions yet. Create your first submission.</div>
          )}
          {metrics?.recent?.map((sub: any) => (
            <Link key={sub.id} href={`/submissions/${sub.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-gray-900">{sub.insuredName}</div>
                <div className="text-xs text-gray-500">{sub.submissionNumber} · <ProductLabel type={sub.productType} /></div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={sub.status} />
                <span className="text-xs text-gray-400">{formatDate(sub.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, highlight, danger }: any) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${danger && value > 0 ? 'border-red-200 bg-red-50' : highlight && value > 0 ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-semibold ${danger && value > 0 ? 'text-red-700' : highlight && value > 0 ? 'text-amber-700' : 'text-gray-900'}`}>{value}</div>
    </div>
  );
}
