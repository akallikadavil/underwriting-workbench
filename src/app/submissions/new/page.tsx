'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { AlertCircle, CheckCircle } from 'lucide-react';

const PRODUCTS = ['INDUSTRIAL_ALL_RISKS','MOVEABLE_ALL_RISKS','ERECTION_ALL_RISKS','CONTRACTOR_WORKS','PRODUCT_LIABILITY','GENERAL_LIABILITY','PUBLIC_LIABILITY','MANAGEMENT_LIABILITY','CYBER_RISK','CYBER_INSURANCE'];
const PRODUCT_LABELS: Record<string,string> = { INDUSTRIAL_ALL_RISKS:'Industrial All Risks',MOVEABLE_ALL_RISKS:'Moveable All Risks',ERECTION_ALL_RISKS:'Erection All Risks',CONTRACTOR_WORKS:'Contractor Works',PRODUCT_LIABILITY:'Product Liability',GENERAL_LIABILITY:'General Liability',PUBLIC_LIABILITY:'Public Liability',MANAGEMENT_LIABILITY:'Management Liability',CYBER_RISK:'Cyber Risk',CYBER_INSURANCE:'Cyber Insurance' };
const INDUSTRIES = ['Manufacturing - Steel','Manufacturing - General','Chemical & Petrochemical','Construction','Real Estate','E-Commerce','Banking & Finance','Energy - Oil & Gas','Energy - Power Generation','Agribusiness','Food Processing','Telecommunications','Transportation','Hospitality','Entertainment','Consumer Products','Reinsurance','Other'];
const LEGAL_BASES = ['CONTRACTUAL','LEGITIMATE_INTEREST','LEGAL_OBLIGATION','VITAL_INTEREST','PUBLIC_TASK','EXPLICIT_CONSENT'];

export default function NewSubmissionPage() {
  useSession({ required: true });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    businessType: 'DIRECT_INSURANCE', transactionType: 'NEW_BUSINESS', productType: '',
    productSubtype: '', insuredName: '', sourceType: 'BROKER', brokerName: '',
    policyStartDate: '', policyEndDate: '', sumInsured: '', currency: 'THB',
    industry: '', riskLocation: '', priorClaimsCount: '0', priorClaimsAmount: '0',
    consentCaptured: false, privacyNoticeAcknowledged: false,
    sensitiveDataPresent: false, sensitiveDataType: '', legalBasis: '',
  });

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.productType) return 'Product type is required.';
    if (!form.insuredName.trim()) return 'Insured name is required.';
    if (!form.riskLocation.trim()) return 'Risk location is required.';
    if (!form.sumInsured || parseFloat(form.sumInsured) <= 0) return 'Sum insured must be greater than 0.';
    if (!form.privacyNoticeAcknowledged) return 'Privacy notice acknowledgement is required before submission.';
    if (form.sensitiveDataPresent && !form.consentCaptured) return 'Consent must be captured when sensitive personal data is present (PDPA Section 26).';
    if (form.sensitiveDataPresent && !form.legalBasis) return 'Legal basis is required when sensitive personal data is present.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent, submitStatus: 'DRAFT' | 'SUBMITTED') {
    e.preventDefault();
    const err = submitStatus === 'SUBMITTED' ? validate() : null;
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, status: submitStatus }) });
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to create submission.'); setLoading(false); return; }
    const data = await res.json();
    if (submitStatus === 'SUBMITTED') {
      await fetch(`/api/submissions/${data.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SUBMITTED' }) });
    }
    router.push(`/submissions/${data.id}`);
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">New Submission</h1>
          <p className="text-sm text-gray-500">All fields marked * are required before submission.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
          </div>
        )}

        <form className="space-y-6">
          {/* Section: Classification */}
          <Section title="Classification">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Business Type *</label>
                <select value={form.businessType} onChange={e => set('businessType', e.target.value)} className="form-select">
                  <option value="DIRECT_INSURANCE">Direct Insurance</option>
                  <option value="REINSURANCE_INWARD">Reinsurance Inward</option>
                </select>
              </div>
              <div>
                <label className="form-label">Transaction Type *</label>
                <select value={form.transactionType} onChange={e => set('transactionType', e.target.value)} className="form-select">
                  <option value="NEW_BUSINESS">New Business</option>
                  <option value="RENEWAL">Renewal</option>
                  <option value="ENDORSEMENT">Endorsement</option>
                </select>
              </div>
              <div>
                <label className="form-label">Product *</label>
                <select value={form.productType} onChange={e => set('productType', e.target.value)} className="form-select">
                  <option value="">Select product</option>
                  {PRODUCTS.map(p => <option key={p} value={p}>{PRODUCT_LABELS[p]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="form-label">Product Subtype</label>
                <input value={form.productSubtype} onChange={e => set('productSubtype', e.target.value)} className="form-input" placeholder="e.g. D&O, EPL, Cyber" />
              </div>
              <div>
                <label className="form-label">Source Type</label>
                <select value={form.sourceType} onChange={e => set('sourceType', e.target.value)} className="form-select">
                  <option value="BROKER">Broker</option>
                  <option value="DIRECT">Direct</option>
                  <option value="REINSURER">Reinsurer</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Section: Insured */}
          <Section title="Insured Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Insured Name *</label>
                <input value={form.insuredName} onChange={e => set('insuredName', e.target.value)} className="form-input" placeholder="Full legal entity name" />
              </div>
              <div>
                <label className="form-label">Broker Name</label>
                <input value={form.brokerName} onChange={e => set('brokerName', e.target.value)} className="form-input" placeholder="Broker or agent name" />
              </div>
              <div>
                <label className="form-label">Industry</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)} className="form-select">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Risk Location *</label>
                <input value={form.riskLocation} onChange={e => set('riskLocation', e.target.value)} className="form-input" placeholder="Province, industrial estate, or address" />
              </div>
            </div>
          </Section>

          {/* Section: Policy */}
          <Section title="Policy Terms">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Policy Start Date</label>
                <input type="date" value={form.policyStartDate} onChange={e => set('policyStartDate', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Policy End Date</label>
                <input type="date" value={form.policyEndDate} onChange={e => set('policyEndDate', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Sum Insured *</label>
                <input type="number" value={form.sumInsured} onChange={e => set('sumInsured', e.target.value)} className="form-input" placeholder="0" min="0" />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)} className="form-select">
                  <option value="THB">THB</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
              <div>
                <label className="form-label">Prior Claims Count</label>
                <input type="number" value={form.priorClaimsCount} onChange={e => set('priorClaimsCount', e.target.value)} className="form-input" min="0" />
              </div>
              <div>
                <label className="form-label">Prior Claims Amount ({form.currency})</label>
                <input type="number" value={form.priorClaimsAmount} onChange={e => set('priorClaimsAmount', e.target.value)} className="form-input" min="0" />
              </div>
            </div>
          </Section>

          {/* Section: PDPA */}
          <Section title="PDPA Compliance">
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.privacyNoticeAcknowledged} onChange={e => set('privacyNoticeAcknowledged', e.target.checked)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Privacy Notice Acknowledged *</div>
                  <div className="text-xs text-gray-500">Insured has received and acknowledged the privacy notice required under Thailand PDPA.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.consentCaptured} onChange={e => set('consentCaptured', e.target.checked)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Consent Captured</div>
                  <div className="text-xs text-gray-500">Explicit consent obtained for processing personal data for underwriting purposes.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.sensitiveDataPresent} onChange={e => set('sensitiveDataPresent', e.target.checked)} className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Sensitive Personal Data Present</div>
                  <div className="text-xs text-gray-500">Submission contains sensitive personal data as defined under PDPA Section 26 (health, financial, biometric, etc.).</div>
                </div>
              </label>
              {form.sensitiveDataPresent && (
                <div className="grid grid-cols-2 gap-4 pl-7 pt-1">
                  <div>
                    <label className="form-label">Sensitive Data Type</label>
                    <input value={form.sensitiveDataType} onChange={e => set('sensitiveDataType', e.target.value)} className="form-input" placeholder="e.g. Health data, Director financials" />
                  </div>
                  <div>
                    <label className="form-label">Legal Basis (PDPA S.26) *</label>
                    <select value={form.legalBasis} onChange={e => set('legalBasis', e.target.value)} className="form-select">
                      <option value="">Select legal basis</option>
                      {LEGAL_BASES.map(b => <option key={b} value={b}>{b.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              AI outputs will require human approval before any underwriting decision. No automated binding, declination, or approval. OIC and PDPA compliance mandatory.
            </div>
          </Section>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={e => handleSubmit(e as any, 'DRAFT')} disabled={loading} className="btn-secondary">
              Save as Draft
            </button>
            <button type="button" onClick={e => handleSubmit(e as any, 'SUBMITTED')} disabled={loading} className="btn-primary">
              {loading ? 'Submitting...' : 'Submit to Underwriting'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
