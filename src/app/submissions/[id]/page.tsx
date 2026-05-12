'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, RiskScore, ProductLabel, formatDate, formatCurrency, isSLABreached, LoadingSpinner, ConfidenceBar, SeverityBadge } from '@/components/ui/shared';
import { AlertTriangle, FileText, Brain, Shield, Upload, Clock, CheckCircle, XCircle, ChevronRight, Download } from 'lucide-react';

const TABS = ['Overview', 'Documents', 'AI Copilot', 'Rules', 'Compliance', 'Audit Log'];

export default function SubmissionDetailPage() {
  const { data: session } = useSession({ required: true });
  const role = (session?.user as any)?.role;
  const params = useParams();
  const router = useRouter();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/submissions/${params.id}`);
    const data = await res.json();
    setSub(data);
    setLoading(false);
  }

  async function loadAudit() {
    const res = await fetch(`/api/audit-logs?entityId=${params.id}&entityType=SUBMISSION`);
    const data = await res.json();
    setAuditLogs(data);
  }

  useEffect(() => {
    if (activeTab === 'Audit Log') loadAudit();
  }, [activeTab]);

  async function changeStatus(status: string, extra?: any) {
    setActionLoading(status);
    await fetch(`/api/submissions/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, ...extra }) });
    await load();
    setActionLoading('');
  }

  async function approveAI(id: string, status: string) {
    await fetch('/api/ai-recommendations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    await load();
  }

  async function uploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: params.id, fileName: file.name, fileType: file.type, documentCategory: 'OTHER' }) });
    await load();
  }

  async function exportFile(format: string) {
    const res = await fetch(`/api/exports?submissionId=${params.id}&format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${sub.submissionNumber}.${format}`; a.click();
  }

  if (loading) return <AppLayout><div className="p-8 flex justify-center"><LoadingSpinner /></div></AppLayout>;
  if (!sub) return <AppLayout><div className="p-8 text-center text-gray-500">Submission not found.</div></AppLayout>;

  const slaBreached = isSLABreached(sub.slaDueDate);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">{sub.insuredName}</h1>
              <StatusBadge status={sub.status} />
              {sub.referralRequired && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">Referral Required</span>}
              {sub.complianceBlocked && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">Compliance Blocked</span>}
              {slaBreached && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />SLA Breached</span>}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              <span className="font-mono">{sub.submissionNumber}</span>
              <span>·</span>
              <ProductLabel type={sub.productType} />
              <span>·</span>
              <span>{sub.transactionType?.replace(/_/g, ' ')}</span>
              <span>·</span>
              <span>{sub.businessType?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {(['APPROVED_FOR_POLICY_PROCESSING','CORE_ENTRY_PENDING','CORE_ENTRY_COMPLETED'].includes(sub.status)) && ['POLICY_PROCESSING','IT_ADMIN','MANAGEMENT'].includes(role) && (
              <>
                <button onClick={() => exportFile('csv')} className="btn-secondary btn-sm"><Download className="w-3 h-3" />CSV</button>
                <button onClick={() => exportFile('json')} className="btn-secondary btn-sm"><Download className="w-3 h-3" />JSON</button>
              </>
            )}
          </div>
        </div>

        {/* Key facts strip */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex flex-wrap gap-6 text-sm">
          <KV label="Sum Insured" value={formatCurrency(sub.sumInsured, sub.currency)} />
          <KV label="Risk Score" value={<RiskScore score={sub.riskScore} />} />
          <KV label="Completeness" value={`${sub.completenessScore ?? '-'}%`} />
          <KV label="Risk Location" value={sub.riskLocation} />
          <KV label="Industry" value={sub.industry || '-'} />
          <KV label="Prior Claims" value={`${sub.priorClaimsCount} (${formatCurrency(sub.priorClaimsAmount, sub.currency)})`} />
          <KV label="SLA Due" value={<span className={slaBreached ? 'text-red-600 font-medium' : ''}>{formatDate(sub.slaDueDate)}</span>} />
          <KV label="Assigned To" value={sub.assignedTo?.name || 'Unassigned'} />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-0">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
                {tab === 'Documents' && sub.documents?.length > 0 && <span className="ml-1.5 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{sub.documents.length}</span>}
                {tab === 'AI Copilot' && sub.aiRecommendations?.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{sub.aiRecommendations.length}</span>}
                {tab === 'Rules' && sub.ruleResults?.filter((r: any) => r.triggered).length > 0 && <span className="ml-1.5 bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">{sub.ruleResults.filter((r: any) => r.triggered).length}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && <OverviewTab sub={sub} role={role} changeStatus={changeStatus} actionLoading={actionLoading} />}
        {activeTab === 'Documents' && <DocumentsTab sub={sub} uploadDoc={uploadDoc} />}
        {activeTab === 'AI Copilot' && <AICopilotTab sub={sub} approveAI={approveAI} role={role} />}
        {activeTab === 'Rules' && <RulesTab sub={sub} />}
        {activeTab === 'Compliance' && <ComplianceTab sub={sub} role={role} reload={load} />}
        {activeTab === 'Audit Log' && <AuditTab logs={auditLogs} />}
      </div>
    </AppLayout>
  );
}

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function OverviewTab({ sub, role, changeStatus, actionLoading }: any) {
  const canUW = ['UNDERWRITER','SENIOR_UNDERWRITER','IT_ADMIN'].includes(role);
  const canSenior = ['SENIOR_UNDERWRITER','IT_ADMIN'].includes(role);
  const canPP = ['POLICY_PROCESSING','IT_ADMIN'].includes(role);

  return (
    <div className="grid grid-cols-3 gap-5">
      <div className="col-span-2 space-y-4">
        {/* Referrals */}
        {sub.referrals?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-orange-800 mb-2">Referrals</h3>
            {sub.referrals.map((r: any) => (
              <div key={r.id} className="text-sm text-orange-700">
                <div className="font-medium">{r.referralReason}</div>
                {r.seniorDecision && <div className="mt-1 text-xs">Decision: {r.seniorDecision} — {r.decisionNotes}</div>}
                <div className="text-xs mt-1">Status: <StatusBadge status={r.referralStatus} /></div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {sub.notes && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Notes</h3>
            <p className="text-sm text-gray-700">{sub.notes}</p>
          </div>
        )}

        {/* Policy processing record */}
        {sub.policyProcessing && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-teal-800 mb-2">Policy Processing</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <KV label="Core Status" value={sub.policyProcessing.coreEntryStatus} />
              <KV label="Core Reference" value={sub.policyProcessing.coreReferenceNumber || '-'} />
              <KV label="Completed" value={formatDate(sub.policyProcessing.completedAt)} />
              <KV label="CSV Exported" value={sub.policyProcessing.csvExported ? '✓' : '—'} />
              <KV label="JSON Exported" value={sub.policyProcessing.jsonExported ? '✓' : '—'} />
            </div>
          </div>
        )}
      </div>

      {/* Actions panel */}
      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
          <div className="space-y-2">
            {sub.status === 'DRAFT' && role === 'MARKETING' && (
              <button onClick={() => changeStatus('SUBMITTED')} disabled={!!actionLoading} className="btn-primary w-full justify-center">Submit to Underwriting</button>
            )}
            {sub.status === 'SUBMITTED' && canUW && (
              <button onClick={() => changeStatus('INTAKE_VALIDATION')} disabled={!!actionLoading} className="btn-primary w-full justify-center">Begin Intake</button>
            )}
            {sub.status === 'INTAKE_VALIDATION' && canUW && (
              <>
                <button onClick={() => changeStatus('ASSIGNED_TO_UNDERWRITING')} disabled={!!actionLoading} className="btn-primary w-full justify-center">Assign to UW</button>
                <button onClick={() => changeStatus('PENDING_INFORMATION')} disabled={!!actionLoading} className="btn-warning w-full justify-center">Request Information</button>
              </>
            )}
            {['ASSIGNED_TO_UNDERWRITING','UNDERWRITING_REVIEW'].includes(sub.status) && canUW && (
              <>
                <button onClick={() => changeStatus('UNDERWRITING_REVIEW')} disabled={!!actionLoading} className="btn-secondary w-full justify-center">Begin UW Review</button>
                <button onClick={() => changeStatus('PENDING_INFORMATION')} disabled={!!actionLoading} className="btn-warning w-full justify-center">Request Information</button>
                {!sub.complianceBlocked && <button onClick={() => changeStatus('APPROVED_FOR_QUOTE')} disabled={!!actionLoading} className="btn-success w-full justify-center">Approve for Quote</button>}
                {!sub.complianceBlocked && <button onClick={() => changeStatus('APPROVED_FOR_POLICY_PROCESSING')} disabled={!!actionLoading} className="btn-success w-full justify-center">Approve for PP</button>}
                <button onClick={() => changeStatus('REFERRAL_REQUIRED')} disabled={!!actionLoading} className="btn-warning w-full justify-center">Refer to Senior</button>
                <button onClick={() => changeStatus('DECLINED')} disabled={!!actionLoading} className="btn-destructive w-full justify-center">Decline</button>
              </>
            )}
            {['REFERRAL_REQUIRED','SENIOR_REVIEW'].includes(sub.status) && canSenior && (
              <>
                <button onClick={() => changeStatus('APPROVED_FOR_QUOTE')} disabled={!!actionLoading || sub.complianceBlocked} className="btn-success w-full justify-center">Approve for Quote</button>
                <button onClick={() => changeStatus('APPROVED_FOR_POLICY_PROCESSING')} disabled={!!actionLoading || sub.complianceBlocked} className="btn-success w-full justify-center">Approve for PP</button>
                <button onClick={() => changeStatus('UNDERWRITING_REVIEW')} disabled={!!actionLoading} className="btn-secondary w-full justify-center">Return to UW</button>
                <button onClick={() => changeStatus('DECLINED')} disabled={!!actionLoading} className="btn-destructive w-full justify-center">Decline</button>
              </>
            )}
            {sub.status === 'APPROVED_FOR_POLICY_PROCESSING' && canPP && (
              <button onClick={() => changeStatus('CORE_ENTRY_PENDING')} disabled={!!actionLoading} className="btn-primary w-full justify-center">Begin Core Entry</button>
            )}
            {sub.status === 'CORE_ENTRY_PENDING' && canPP && (
              <button onClick={() => changeStatus('CORE_ENTRY_COMPLETED')} disabled={!!actionLoading} className="btn-success w-full justify-center">Mark Core Entry Done</button>
            )}
            {sub.status === 'CORE_ENTRY_COMPLETED' && canPP && (
              <button onClick={() => changeStatus('CLOSED')} disabled={!!actionLoading} className="btn-secondary w-full justify-center">Close</button>
            )}
            {sub.complianceBlocked && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">Compliance block active. Approval actions disabled until resolved.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ sub, uploadDoc }: any) {
  const CATEGORY_LABELS: Record<string,string> = { PROPOSAL_FORM:'Proposal Form',SITE_SURVEY:'Site Survey',LOSS_HISTORY:'Loss History',REINSURANCE_SLIP:'Reinsurance Slip',FINANCIAL_STATEMENTS:'Financial Statements',RISK_ASSESSMENT:'Risk Assessment',MFA_DOCUMENTATION:'MFA Documentation',INCIDENT_RESPONSE_PLAN:'Incident Response Plan',PRIOR_POLICY:'Prior Policy',ENDORSEMENT_REQUEST:'Endorsement Request',COMPLIANCE_DOCUMENT:'Compliance Document',OTHER:'Other' };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{sub.documents?.length} Documents</h3>
        <label className="btn-secondary btn-sm cursor-pointer">
          <Upload className="w-3 h-3" /> Upload Document
          <input type="file" className="hidden" onChange={uploadDoc} accept=".pdf,.doc,.docx,.xlsx,.png,.jpg" />
        </label>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {sub.documents?.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No documents uploaded.</div>}
        {sub.documents?.map((doc: any) => (
          <div key={doc.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
                <div className="text-xs text-gray-500">{CATEGORY_LABELS[doc.documentCategory] || doc.documentCategory} · {formatDate(doc.createdAt)}</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border ${doc.extractionStatus === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : doc.extractionStatus === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {doc.extractionStatus}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AICopilotTab({ sub, approveAI, role }: any) {
  const canReview = ['UNDERWRITER','SENIOR_UNDERWRITER','COMPLIANCE','IT_ADMIN'].includes(role);
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        AI outputs are advisory only. Human approval is mandatory before any underwriting decision. No AI output may be used to auto-bind, auto-decline, or auto-approve. Each recommendation must be individually reviewed.
      </div>
      {sub.aiRecommendations?.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">No AI recommendations generated yet.</div>}
      <div className="space-y-3">
        {sub.aiRecommendations?.map((rec: any) => (
          <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{rec.agentName}</span>
                  <span className="text-xs text-gray-500">{rec.recommendationType.replace(/_/g,' ')}</span>
                </div>
              </div>
              <StatusBadge status={rec.status} />
            </div>
            <p className="text-sm text-gray-800 mb-2">{rec.recommendationText}</p>
            <div className="text-xs text-gray-500 mb-2"><span className="font-medium">Rationale:</span> {rec.rationale}</div>
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <ConfidenceBar score={rec.confidenceScore} />
            </div>
            {rec.status === 'PENDING' && canReview && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => approveAI(rec.id, 'APPROVED')} className="btn-success btn-xs">
                  <CheckCircle className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => approveAI(rec.id, 'REJECTED')} className="btn-destructive btn-xs">
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            )}
            {rec.approvedBy && <div className="text-xs text-gray-400 mt-1">Reviewed by {rec.approvedBy.name}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesTab({ sub }: any) {
  const triggered = sub.ruleResults?.filter((r: any) => r.triggered) || [];
  const passed = sub.ruleResults?.filter((r: any) => !r.triggered) || [];
  return (
    <div className="space-y-4">
      {triggered.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Triggered Rules ({triggered.length})</h3>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {triggered.map((r: any) => (
              <div key={r.id} className="flex items-start justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={r.severity} />
                    <span className="text-sm font-medium text-gray-900">{r.rule.ruleName}</span>
                  </div>
                  <p className="text-xs text-gray-600">{r.message}</p>
                </div>
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 ml-3" />
              </div>
            ))}
          </div>
        </div>
      )}
      {passed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Rules Not Triggered ({passed.length})</h3>
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-50">
            {passed.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500">{r.rule.ruleName}</span>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComplianceTab({ sub, role, reload }: any) {
  const cr = sub.complianceRecord;
  const [saving, setSaving] = useState(false);
  const canEdit = ['COMPLIANCE','IT_ADMIN'].includes(role);

  async function approve() {
    setSaving(true);
    await fetch('/api/compliance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submissionId: sub.id, humanReviewCompleted: true, complianceStatus: 'APPROVED' }) });
    await reload();
    setSaving(false);
  }

  if (!cr) return <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-400">No compliance record.</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">PDPA Compliance Record</h3>
          <StatusBadge status={cr.complianceStatus} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Check label="Consent Captured" value={cr.consentCaptured} />
          <Check label="Privacy Notice Acknowledged" value={cr.privacyNoticeAcknowledged} />
          <Check label="Human Review Completed" value={cr.humanReviewCompleted} />
          <Check label="Cross-Border Transfer" value={cr.crossBorderTransferRequired} neutral />
          <KV label="Sensitive Data Present" value={cr.sensitiveDataPresent ? <span className="text-amber-600">{cr.sensitiveDataType || 'Yes'}</span> : 'No'} />
          <KV label="Legal Basis" value={cr.legalBasis || <span className="text-red-500">Not specified</span>} />
          <KV label="Data Retention Class" value={cr.dataRetentionClass || '-'} />
          {cr.approvedBy && <KV label="Approved By" value={cr.approvedBy.name} />}
        </div>
        {canEdit && cr.complianceStatus !== 'APPROVED' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={approve} disabled={saving} className="btn-success btn-sm">
              <CheckCircle className="w-3.5 h-3.5" /> Approve Compliance
            </button>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-400 p-3 bg-gray-50 border border-gray-200 rounded">
        Thailand PDPA Section 26 applies to sensitive personal data. OIC requires human review of all AI outputs. Final regulatory interpretation must be validated by Thailand counsel.
      </div>
    </div>
  );
}

function Check({ label, value, neutral }: { label: string; value: boolean; neutral?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {value ? <CheckCircle className={`w-4 h-4 ${neutral ? 'text-blue-500' : 'text-green-500'}`} /> : <XCircle className="w-4 h-4 text-red-400" />}
      <span className={`text-sm ${!value && !neutral ? 'text-red-600' : 'text-gray-700'}`}>{label}</span>
    </div>
  );
}

function AuditTab({ logs }: { logs: any[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {logs.length === 0 && <div className="p-6 text-center text-sm text-gray-400">No audit entries.</div>}
      {logs.map((log: any) => (
        <div key={log.id} className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">{log.action.replace(/_/g,' ')}</div>
            <div className="text-xs text-gray-500">{log.user?.name || 'System'} · {log.entityType}</div>
          </div>
          <div className="text-xs text-gray-400 font-mono">{formatDate(log.timestamp)}</div>
        </div>
      ))}
    </div>
  );
}
