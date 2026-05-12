'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, RiskScore, ProductLabel, formatDate, isSLABreached, formatCurrency, LoadingSpinner } from '@/components/ui/shared';
import { AlertTriangle } from 'lucide-react';

const UW_STATUSES = ['SUBMITTED','INTAKE_VALIDATION','PENDING_INFORMATION','ASSIGNED_TO_UNDERWRITING','UNDERWRITING_REVIEW','REFERRAL_REQUIRED'];

export default function UWQueuePage() {
  useSession({ required: true });
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', referral: '', compliance: '' });

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    else params.set('status', UW_STATUSES.join(','));
    if (filter.referral === 'true') params.set('referralRequired', 'true');
    if (filter.compliance === 'true') params.set('complianceBlocked', 'true');
    params.set('limit', '50');
    const res = await fetch(`/api/submissions?${params}`);
    const data = await res.json();
    // Filter to UW statuses if no specific status
    const subs = filter.status ? (data.submissions || []) : (data.submissions || []).filter((s: any) => UW_STATUSES.includes(s.status));
    setSubmissions(subs);
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Underwriting Queue</h1>
            <p className="text-sm text-gray-500">{submissions.length} cases</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3 flex-wrap">
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="form-select w-52">
            <option value="">All UW Statuses</option>
            {UW_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select value={filter.referral} onChange={e => setFilter(f => ({ ...f, referral: e.target.value }))} className="form-select w-44">
            <option value="">All</option>
            <option value="true">Referral Required</option>
          </select>
          <select value={filter.compliance} onChange={e => setFilter(f => ({ ...f, compliance: e.target.value }))} className="form-select w-44">
            <option value="">All</option>
            <option value="true">Compliance Blocked</option>
          </select>
          <button onClick={() => setFilter({ status: '', referral: '', compliance: '' })} className="btn-secondary btn-sm">Clear</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference','Insured','Product','Sum Insured','Risk','Status','SLA','Flags','Assigned To','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-sm text-gray-400">No submissions in queue.</td></tr>}
                {submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{sub.submissionNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate">{sub.insuredName}</div>
                      <div className="text-xs text-gray-400">{sub.brokerName}</div>
                    </td>
                    <td className="px-4 py-3 text-xs"><ProductLabel type={sub.productType} /></td>
                    <td className="px-4 py-3 text-xs font-mono">{formatCurrency(sub.sumInsured, sub.currency)}</td>
                    <td className="px-4 py-3"><RiskScore score={sub.riskScore} /></td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                    <td className="px-4 py-3">
                      {isSLABreached(sub.slaDueDate)
                        ? <span className="text-xs text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Breached</span>
                        : <span className="text-xs text-gray-400">{formatDate(sub.slaDueDate)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {sub.referralRequired && <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">Ref</span>}
                        {sub.complianceBlocked && <span className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded">PDPA</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{sub.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/submissions/${sub.id}`} className="btn-primary btn-xs">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
