'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, ProductLabel, formatDate, LoadingSpinner } from '@/components/ui/shared';
import { CheckCircle, XCircle, AlertTriangle, Globe } from 'lucide-react';

export default function CompliancePage() {
  useSession({ required: true });
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    const res = await fetch(`/api/compliance?${params}`);
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }

  async function approveCompliance(submissionId: string) {
    await fetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId, humanReviewCompleted: true, complianceStatus: 'APPROVED' }) });
    await load();
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Compliance Dashboard</h1>
            <p className="text-sm text-gray-500">PDPA · OIC · Data protection monitoring</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 flex gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="form-select w-48">
            <option value="">All Status</option>
            <option value="BLOCKED">Blocked</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
            <option value="APPROVED">Approved</option>
            <option value="CLEAR">Clear</option>
          </select>
        </div>

        {loading ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
          <div className="space-y-3">
            {records.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">No compliance records found.</div>}
            {records.map((r: any) => (
              <div key={r.id} className={`bg-white rounded-lg border p-4 ${r.complianceStatus === 'BLOCKED' ? 'border-red-200' : r.complianceStatus === 'REVIEW_REQUIRED' ? 'border-amber-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/submissions/${r.submissionId}`} className="text-sm font-medium text-blue-700 hover:underline">{r.submission?.insuredName}</Link>
                      <span className="font-mono text-xs text-gray-400">{r.submission?.submissionNumber}</span>
                      <StatusBadge status={r.complianceStatus} />
                    </div>
                    <div className="text-xs text-gray-500 mb-3"><ProductLabel type={r.submission?.productType} /></div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <Flag label="Consent" ok={r.consentCaptured} />
                      <Flag label="Privacy Notice" ok={r.privacyNoticeAcknowledged} />
                      <Flag label="Human Review" ok={r.humanReviewCompleted} />
                      {r.sensitiveDataPresent && (
                        <span className="flex items-center gap-1 text-amber-700"><AlertTriangle className="w-3 h-3" />Sensitive Data: {r.sensitiveDataType || 'Present'}</span>
                      )}
                      {r.crossBorderTransferRequired && (
                        <span className="flex items-center gap-1 text-blue-600"><Globe className="w-3 h-3" />Cross-Border Transfer</span>
                      )}
                      {r.sensitiveDataPresent && !r.legalBasis && (
                        <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3 h-3" />No Legal Basis</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link href={`/submissions/${r.submissionId}`} className="btn-secondary btn-xs">View</Link>
                    {r.complianceStatus !== 'APPROVED' && r.complianceStatus !== 'CLEAR' && (
                      <button onClick={() => approveCompliance(r.submissionId)} className="btn-success btn-xs">
                        <CheckCircle className="w-3 h-3" />Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Flag({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`flex items-center gap-1 ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}
