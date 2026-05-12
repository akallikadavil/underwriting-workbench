'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { LoadingSpinner } from '@/components/ui/shared';
import { Plus, User } from 'lucide-react';

const ROLES = ['MARKETING','UNDERWRITER','SENIOR_UNDERWRITER','POLICY_PROCESSING','IT_ADMIN','COMPLIANCE','MANAGEMENT'];

export default function AdminUsersPage() {
  useSession({ required: true });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'UNDERWRITER', department: '', password: 'Password123!' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/users');
    setUsers(await res.json());
    setLoading(false);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setCreating(false);
    setForm({ name: '', email: '', role: 'UNDERWRITER', department: '', password: 'Password123!' });
    await load();
    setSaving(false);
  }

  async function toggleUser(id: string, active: boolean) {
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
    await load();
  }

  const roleColor: Record<string,string> = { MARKETING:'bg-violet-100 text-violet-700',UNDERWRITER:'bg-blue-100 text-blue-700',SENIOR_UNDERWRITER:'bg-indigo-100 text-indigo-700',POLICY_PROCESSING:'bg-teal-100 text-teal-700',IT_ADMIN:'bg-gray-100 text-gray-700',COMPLIANCE:'bg-amber-100 text-amber-700',MANAGEMENT:'bg-slate-100 text-slate-700' };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500">{users.length} users</p>
          </div>
          <button onClick={() => setCreating(true)} className="btn-primary"><Plus className="w-4 h-4" />Add User</button>
        </div>

        {creating && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">New User</h2>
            <form onSubmit={createUser} className="grid grid-cols-3 gap-4">
              <div><label className="form-label">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" required /></div>
              <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" required /></div>
              <div><label className="form-label">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="form-select">
                  {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div><label className="form-label">Department</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="form-input" /></div>
              <div><label className="form-label">Password</label><input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="form-input" /></div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={saving} className="btn-primary">Create</button>
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
                  {['Name','Email','Role','Department','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded font-medium ${roleColor[u.role] || ''}`}>{u.role.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.department || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(u.id, u.active)} className="text-xs text-gray-500 hover:text-gray-800 underline">{u.active ? 'Deactivate' : 'Activate'}</button>
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
