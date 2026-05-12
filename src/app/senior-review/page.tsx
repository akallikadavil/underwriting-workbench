'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, RiskScore, ProductLabel, formatDate, formatCurrency, LoadingSpinner, SeverityBadge } from '@/components/ui/shared';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function SeniorReviewPage() {
  useSession({ required: true });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/referrals');
    const data = await res.json();
    setReferrals(data.filter((r: any) => r.referralStatus === 'PENDING'));
    setLoading(false);
  }

  async function decide(id: string, referralStatus: string) {
    await fetch('/api/referrals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, referralStatus, seniorDecision: referralStatus, decisionNotes: notes }) });
    setDeciding(null);
    setNotes('');
    await load();
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Senior Underwriter Referral Queue</h1>
          <p className="text-sm text-gray-500">{referrals.length} pending referrals</p>
        </div>

        {loading ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
          <div className="space-y-4">
            {referrals.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">No pending referrals.</div>
            )}
            {referrals.map((ref: any) => (
              <div key={ref.id} className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/submissions/${ref.submissionId}`} className="text-sm font-semibold text-blue-700 hover:underline">{ref.submission?.insuredName}</Link>
                      <span className="font-mono text-xs text-gray-400">{ref.submission?.submissionNumber}</span>
                      <StatusBadge status={ref.referralStatus} />
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      <ProductLabel type={ref.submission?.productType} /> · Referred by {ref.referredBy?.name} · {formatDate(ref.createdAt)}
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-800">
                      <span className="font-medium">Referral Reason: </span>{ref.referralReason}
                    </div>
                  </div>
                </div>

                {deciding === ref.id ? (
                  <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <label className="form-label">Decision Notes</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input h-20" placeholder="Conditions, rationale, or rejection reasoning..." />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => decide(ref.id, 'APPROVED')} className="btn-success btn-sm"><CheckCircle className="w-3.5 h-3.5" />Approve</button>
                      <button onClick={() => decide(ref.id, 'APPROVED_WITH_CONDITIONS')} className="btn-warning btn-sm">Approve with Conditions</button>
                      <button onClick={() => decide(ref.id, 'RETURNED')} className="btn-secondary btn-sm">Return to UW</button>
                      <button onClick={() => decide(ref.id, 'DECLINED')} className="btn-destructive btn-sm"><XCircle className="w-3.5 h-3.5" />Decline</button>
                      <button onClick={() => setDeciding(null)} className="btn-secondary btn-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Link href={`/submissions/${ref.submissionId}`} className="btn-secondary btn-sm">View Submission</Link>
                    <button onClick={() => setDeciding(ref.id)} className="btn-primary btn-sm">Make Decision</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
