'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Clock, CheckCircle, Shield } from 'lucide-react';
import { StatusBadge, RiskScore, formatDate, isSLABreached, ProductLabel, LoadingSpinner } from '@/components/ui/shared';

export function UnderwriterDashboard() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setMetrics(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

  const queueHref = role === 'SENIOR_UNDERWRITER' ? '/senior-review' : '/underwriting/queue';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{role === 'SENIOR_UNDERWRITER' ? 'Senior Underwriter' : 'Underwriter'} Dashboard</h1>
          <p className="text-sm text-gray-500">{session?.user?.name}</p>
        </div>
        <Link href={queueHref} className="btn-primary">View Queue</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">My Queue</div>
          <div className="text-2xl font-semibold text-gray-900">{metrics?.myQueue ?? 0}</div>
        </div>
        <div className={`bg-white rounded-lg border p-4 ${metrics?.referralRequired > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Referrals Pending</div>
          <div className={`text-2xl font-semibold ${metrics?.referralRequired > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{metrics?.referralRequired ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending Info</div>
          <div className="text-2xl font-semibold text-amber-600">{metrics?.pendingInfo ?? 0}</div>
        </div>
        <div className={`bg-white rounded-lg border p-4 ${metrics?.slaBreach > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">SLA Breach</div>
          <div className={`text-2xl font-semibold ${metrics?.slaBreach > 0 ? 'text-red-700' : 'text-gray-900'}`}>{metrics?.slaBreach ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Active Cases</h2>
          <Link href="/underwriting/queue" className="text-xs text-blue-600 hover:underline">Full queue</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(!metrics?.recentQueue || metrics.recentQueue.length === 0) && (
            <div className="p-6 text-center text-sm text-gray-400">No active cases in queue.</div>
          )}
          {metrics?.recentQueue?.map((sub: any) => (
            <Link key={sub.id} href={`/submissions/${sub.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{sub.insuredName}</span>
                  {sub.referralRequired && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">Referral</span>}
                  {sub.complianceBlocked && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Compliance Block</span>}
                </div>
                <div className="text-xs text-gray-500">{sub.submissionNumber} · <ProductLabel type={sub.productType} /></div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <RiskScore score={sub.riskScore} />
                <StatusBadge status={sub.status} />
                {isSLABreached(sub.slaDueDate) && <span className="text-xs text-red-600 font-medium">SLA</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
