'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { LoadingSpinner, SeverityBadge } from '@/components/ui/shared';
import { Plus, CheckCircle, XCircle } from 'lucide-react';

export default function AdminRulesPage() {
  useSession({ required: true });
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ruleName: '', ruleType: 'REFERRAL', severity: 'MEDIUM', description: '', conditionJson: '{"field":"sumInsured","operator":"gt","value":100000000}', actionJson: '{"action":"REFERRAL_REQUIRED","message":"Referral required."}', active: true });

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const res = await fetch('/api/rules');
    setRules(await res.json());
    setLoading(false);
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, conditionJson: JSON.parse(form.conditionJson), actionJson: JSON.parse(form.actionJson) }) });
      setCreating(false);
      await load();
    } catch { alert('Invalid JSON in condition or action fields.'); }
  }

  async function toggleRule(id: string, active: boolean) {
    await fetch('/api/rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
    await load();
  }

  const typeColor: Record<string,string> = { REFERRAL:'bg-orange-100 text-orange-700',BLOCK:'bg-red-100 text-red-700',WARNING:'bg-amber-100 text-amber-700',INFO:'bg-blue-100 text-blue-700' };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Rules Engine</h1>
            <p className="text-sm text-gray-500">{rules.length} rules · Thailand · OIC</p>
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Rule</button>
        </div>

        {creating && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">New Rule</h2>
            <form onSubmit={createRule} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">Rule Name</label><input value={form.ruleName} onChange={e => setForm(f=>({...f,ruleName:e.target.value}))} className="form-input" required /></div>
                <div><label className="form-label">Type</label>
                  <select value={form.ruleType} onChange={e => setForm(f=>({...f,ruleType:e.target.value}))} className="form-select">
                    {['REFERRAL','BLOCK','WARNING','INFO'].map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f=>({...f,severity:e.target.value}))} className="form-select">
                    {['HIGH','MEDIUM','LOW'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="form-label">Description</label><input value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="form-input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Condition JSON</label><textarea value={form.conditionJson} onChange={e => setForm(f=>({...f,conditionJson:e.target.value}))} className="form-input h-24 font-mono text-xs" /></div>
                <div><label className="form-label">Action JSON</label><textarea value={form.actionJson} onChange={e => setForm(f=>({...f,actionJson:e.target.value}))} className="form-input h-24 font-mono text-xs" /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Create Rule</button>
                <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? <div className="p-8 flex justify-center"><LoadingSpinner /></div> : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Rule Name','Type','Severity','Product','Description','Status','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map((r: any) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${!r.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.ruleName}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[r.ruleType]||''}`}>{r.ruleType}</span></td>
                    <td className="px-4 py-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.productType || 'All'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{r.description || '—'}</td>
                    <td className="px-4 py-3">
                      {r.active ? <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3.5 h-3.5" />Active</span> : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3.5 h-3.5" />Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRule(r.id, r.active)} className="text-xs text-gray-500 hover:text-gray-800 underline">{r.active ? 'Disable' : 'Enable'}</button>
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
