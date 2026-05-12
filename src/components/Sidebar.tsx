'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, FileText, ClipboardList, Shield, Package,
  Users, Settings, BarChart3, LogOut, AlertTriangle, CheckCircle, Briefcase
} from 'lucide-react';

const roleNavItems: Record<string, { label: string; href: string; icon: any }[]> = {
  MARKETING: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'New Submission', href: '/submissions/new', icon: FileText },
    { label: 'My Submissions', href: '/submissions', icon: ClipboardList },
  ],
  UNDERWRITER: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'UW Queue', href: '/underwriting/queue', icon: ClipboardList },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
  ],
  SENIOR_UNDERWRITER: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Referral Queue', href: '/senior-review', icon: AlertTriangle },
    { label: 'UW Queue', href: '/underwriting/queue', icon: ClipboardList },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
  ],
  POLICY_PROCESSING: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Processing Queue', href: '/policy-processing', icon: Package },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
  ],
  IT_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Rules Engine', href: '/admin/rules', icon: Settings },
    { label: 'ASEAN Config', href: '/admin/config', icon: Settings },
    { label: 'Audit Logs', href: '/admin/audit', icon: CheckCircle },
  ],
  COMPLIANCE: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Compliance Queue', href: '/compliance', icon: Shield },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
    { label: 'Audit Logs', href: '/admin/audit', icon: CheckCircle },
  ],
  MANAGEMENT: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Reports', href: '/management', icon: BarChart3 },
    { label: 'All Submissions', href: '/submissions', icon: FileText },
    { label: 'Compliance', href: '/compliance', icon: Shield },
  ],
};

const roleLabels: Record<string, string> = {
  MARKETING: 'Marketing',
  UNDERWRITER: 'Underwriter',
  SENIOR_UNDERWRITER: 'Senior Underwriter',
  POLICY_PROCESSING: 'Policy Processing',
  IT_ADMIN: 'IT Admin',
  COMPLIANCE: 'Compliance',
  MANAGEMENT: 'Management',
};

const roleColors: Record<string, string> = {
  MARKETING: 'bg-violet-600',
  UNDERWRITER: 'bg-blue-700',
  SENIOR_UNDERWRITER: 'bg-indigo-800',
  POLICY_PROCESSING: 'bg-teal-700',
  IT_ADMIN: 'bg-gray-700',
  COMPLIANCE: 'bg-amber-700',
  MANAGEMENT: 'bg-slate-800',
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'UNDERWRITER';
  const navItems = roleNavItems[role] || roleNavItems.UNDERWRITER;

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 leading-tight">UW Workbench</div>
            <div className="text-xs text-gray-400">Thailand · OIC</div>
          </div>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${roleColors[role] || 'bg-gray-600'} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
            {session?.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">{session?.user?.name}</div>
            <div className="text-xs text-gray-500">{roleLabels[role]}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
