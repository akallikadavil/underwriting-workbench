'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Briefcase, Eye, EyeOff, AlertCircle } from 'lucide-react';

const TEST_USERS = [
  { email: 'marketing@uwworkbench.th', role: 'Marketing', color: 'bg-violet-100 text-violet-700' },
  { email: 'underwriter@uwworkbench.th', role: 'Underwriter', color: 'bg-blue-100 text-blue-700' },
  { email: 'senior@uwworkbench.th', role: 'Senior Underwriter', color: 'bg-indigo-100 text-indigo-700' },
  { email: 'policy@uwworkbench.th', role: 'Policy Processing', color: 'bg-teal-100 text-teal-700' },
  { email: 'itadmin@uwworkbench.th', role: 'IT Admin', color: 'bg-gray-100 text-gray-700' },
  { email: 'compliance@uwworkbench.th', role: 'Compliance', color: 'bg-amber-100 text-amber-700' },
  { email: 'management@uwworkbench.th', role: 'Management', color: 'bg-slate-100 text-slate-700' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) { setError('Invalid email or password.'); return; }
    router.push('/dashboard');
  }

  function quickLogin(u: typeof TEST_USERS[0]) {
    setEmail(u.email);
    setPassword('Password123!');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left panel */}
        <div className="text-white flex flex-col justify-center px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold leading-tight">Agentic Underwriting</div>
              <div className="text-lg font-bold text-blue-300 leading-tight">Workbench</div>
            </div>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Commercial insurance underwriting platform for Thailand. OIC-compliant. PDPA-aware. AI-assisted with mandatory human review.
          </p>
          <div className="space-y-2">
            {['Industrial All Risks · Cyber · Liability products', 'Seven-role workflow: Marketing to Policy Processing', 'PDPA consent capture and compliance controls', 'AI copilot with confidence scoring and human approval'].map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-blue-400 mt-0.5">›</span>
                {f}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="text-xs text-slate-500">Regulatory authority: Office of Insurance Commission (OIC) · Thailand PDPA applies · AI outputs require human approval before binding</div>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-5">All sessions are audited per OIC requirements.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="user@uwworkbench.th" required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="form-input pr-10" placeholder="Password" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-2 font-medium">Quick access — test accounts (all: Password123!)</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TEST_USERS.map(u => (
                <button key={u.email} onClick={() => quickLogin(u)} className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${u.color} hover:opacity-80 transition-opacity`}>
                  {u.role}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Click a role, then Sign in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
