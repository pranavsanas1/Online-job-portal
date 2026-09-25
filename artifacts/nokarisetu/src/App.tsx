import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  Gauge,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getHealthCheckQueryKey,
  getListApplicationsQueryKey,
  getListJobsQueryKey,
  getListUsersQueryKey,
  useCreateApplication,
  useCreateJob,
  useGetDashboard,
  useHealthCheck,
  useListApplications,
  useListJobs,
  useListUsers,
  useUpdateApplicationStatus,
  useUpdateUserStatus,
} from '@workspace/api-client-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Role = 'seeker' | 'recruiter' | 'admin';
type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
type UserStatus = 'pending' | 'accepted' | 'removed';

type Metric = { label: string; value: string; change: string; tone: string };
type ActivityItem = { id: number; title: string; detail: string; time: string; tone: string };
type DashboardData = { role: string; headline: string; metrics: Metric[]; activity: ActivityItem[] };
type JobData = {
  id: number; title: string; company: string; location: string; type: string;
  salary: string; posted: string; applicants: number; status: 'active' | 'paused' | 'closed';
};
type ApplicationData = {
  id: number; jobTitle: string; company: string; candidate: string; submitted: string;
  status: ApplicationStatus; match: number;
};
type UserData = {
  id: number; name: string; email: string; role: Role; joined: string; status: UserStatus;
};

const fallbackDashboard: Record<Role, DashboardData> = {
  seeker: {
    role: 'seeker',
    headline: 'Your next move is closer than it feels.',
    metrics: [
      { label: 'Applications in motion', value: '06', change: '+2 this week', tone: 'positive' },
      { label: 'Profile match strength', value: '78%', change: '+8% this month', tone: 'positive' },
      { label: 'Saved for later', value: '14', change: '3 closing soon', tone: 'attention' },
    ],
    activity: [
      { id: 1, title: 'Application viewed', detail: 'Product Designer · Katha Studio', time: '2h ago', tone: 'positive' },
      { id: 2, title: 'New role fits your profile', detail: 'UX Researcher · Fieldnote', time: 'Yesterday', tone: 'neutral' },
      { id: 3, title: 'Profile needs one detail', detail: 'Add your portfolio link to improve match quality', time: '2d ago', tone: 'attention' },
    ],
  },
  recruiter: {
    role: 'recruiter',
    headline: 'A clearer view of the people behind every application.',
    metrics: [
      { label: 'Open roles', value: '09', change: '+2 this month', tone: 'positive' },
      { label: 'Candidates to review', value: '47', change: '12 new today', tone: 'attention' },
      { label: 'Avg. time to shortlist', value: '3.8d', change: '0.6d faster', tone: 'positive' },
    ],
    activity: [
      { id: 1, title: 'Shortlist ready', detail: 'Senior Product Designer · 8 candidates', time: '36m ago', tone: 'positive' },
      { id: 2, title: 'New applications', detail: 'Growth Marketing Lead · 5 new people', time: '3h ago', tone: 'neutral' },
      { id: 3, title: 'Role needs attention', detail: 'Frontend Engineer has been open for 21 days', time: 'Yesterday', tone: 'attention' },
    ],
  },
  admin: {
    role: 'admin',
    headline: 'Keep the marketplace worthy of people’s time.',
    metrics: [
      { label: 'Active members', value: '2,418', change: '+6.4% this month', tone: 'positive' },
      { label: 'Needs moderation', value: '18', change: '5 high priority', tone: 'attention' },
      { label: 'Jobs live today', value: '326', change: '+14 this week', tone: 'neutral' },
    ],
    activity: [
      { id: 1, title: 'Moderation queue is moving', detail: '12 user reviews completed today', time: '1h ago', tone: 'positive' },
      { id: 2, title: 'New recruiter account', detail: 'Makers & Co. is ready for review', time: '4h ago', tone: 'neutral' },
      { id: 3, title: 'Report needs a decision', detail: 'Listing flagged by 3 community members', time: 'Yesterday', tone: 'attention' },
    ],
  },
};

const fallbackJobs: JobData[] = [
  { id: 101, title: 'Product Designer', company: 'Katha Studio', location: 'Bengaluru · Hybrid', type: 'Full-time', salary: '₹18–24L', posted: '2 days ago', applicants: 28, status: 'active' },
  { id: 102, title: 'Frontend Engineer', company: 'Fieldnote', location: 'Remote · India', type: 'Full-time', salary: '₹16–22L', posted: '4 days ago', applicants: 41, status: 'active' },
  { id: 103, title: 'Community Programs Lead', company: 'Awaaz Foundation', location: 'Mumbai · On-site', type: 'Full-time', salary: '₹11–15L', posted: '1 week ago', applicants: 17, status: 'active' },
  { id: 104, title: 'Operations Associate', company: 'Makers & Co.', location: 'Pune · Hybrid', type: 'Contract', salary: '₹8–10L', posted: '8 days ago', applicants: 12, status: 'paused' },
];

const fallbackApplications: ApplicationData[] = [
  { id: 201, jobTitle: 'Product Designer', company: 'Katha Studio', candidate: 'You', submitted: '18 Jun 2024', status: 'pending', match: 92 },
  { id: 202, jobTitle: 'Design Systems Lead', company: 'Lattice Labs', candidate: 'You', submitted: '15 Jun 2024', status: 'accepted', match: 86 },
  { id: 203, jobTitle: 'UX Researcher', company: 'Fieldnote', candidate: 'You', submitted: '09 Jun 2024', status: 'rejected', match: 74 },
];

const fallbackUsers: UserData[] = [
  { id: 301, name: 'Aarav Mehta', email: 'aarav@kathastudio.in', role: 'recruiter', joined: '18 Jun 2024', status: 'pending' },
  { id: 302, name: 'Meera Iyer', email: 'meera.iyer@mail.com', role: 'seeker', joined: '17 Jun 2024', status: 'accepted' },
  { id: 303, name: 'Rohan Das', email: 'rohan@fieldnote.co', role: 'recruiter', joined: '14 Jun 2024', status: 'accepted' },
  { id: 304, name: 'Naina Kapoor', email: 'naina.kapoor@mail.com', role: 'seeker', joined: '12 Jun 2024', status: 'removed' },
];

const roleCopy: Record<Role, { label: string; eyebrow: string; avatar: string }> = {
  seeker: { label: 'Job seeker', eyebrow: 'My workspace', avatar: 'MS' },
  recruiter: { label: 'Recruiter', eyebrow: 'Hiring workspace', avatar: 'AK' },
  admin: { label: 'Administrator', eyebrow: 'Platform control', avatar: 'NK' },
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatRole(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function StatusPill({ value }: { value: string }) {
  const tone = value === 'accepted' || value === 'active' ? 'success' : value === 'rejected' || value === 'removed' || value === 'closed' ? 'danger' : value === 'paused' ? 'warm' : 'neutral';
  return (
    <span data-testid={`status-${value}`} className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]',
      tone === 'success' && 'border-primary/25 bg-primary/10 text-primary',
      tone === 'danger' && 'border-destructive/25 bg-destructive/10 text-destructive',
      tone === 'warm' && 'border-accent/30 bg-accent/15 text-foreground',
      tone === 'neutral' && 'border-border bg-muted/70 text-muted-foreground',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'success' && 'bg-primary', tone === 'danger' && 'bg-destructive', tone === 'warm' && 'bg-accent', tone === 'neutral' && 'bg-muted-foreground')} />
      {value}
    </span>
  );
}

function Button({ children, className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      {...props}
      className={cn(
        'focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-[0_5px_0_hsl(161_45%_25%)] hover:-translate-y-0.5',
        variant === 'secondary' && 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted',
        variant === 'ghost' && 'text-muted-foreground hover:bg-muted hover:text-foreground',
        variant === 'danger' && 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15',
        className,
      )}
    >
      {children}
    </button>
  );
}

function SectionHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 data-testid="text-page-title" className="font-display text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">{title}</h1>
        {detail && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Sparkles size={21} /></div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
      <span className="flex items-center gap-2"><CircleAlert size={17} /> Live data is taking a moment. Demo data is shown meanwhile.</span>
      <Button variant="danger" onClick={retry}>Retry</Button>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-muted', className)} />;
}

function Shell({ role, setRole, children, notify }: { role: Role; setRole: (role: Role) => void; children: ReactNode; notify: (message: string) => void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const nav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['seeker', 'recruiter', 'admin'] },
    { href: '/jobs', label: 'Jobs', icon: BriefcaseBusiness, roles: ['seeker', 'recruiter', 'admin'] },
    { href: '/applications', label: 'Applications', icon: FileCheck2, roles: ['seeker', 'recruiter'] },
    { href: '/users', label: 'Users', icon: UsersRound, roles: ['admin'] },
    { href: '/settings', label: 'Settings', icon: Settings2, roles: ['seeker', 'recruiter', 'admin'] },
  ];
  return (
    <div className="grain app-shell min-h-[100dvh] text-foreground">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 transition-transform duration-300 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" data-testid="link-brand" className="flex items-center gap-3 text-sidebar-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-sidebar-primary font-display text-xl font-bold text-sidebar-primary-foreground">N</span>
            <span><span className="block font-display text-lg font-semibold tracking-[-0.03em]">NokariSetu</span><span className="block text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">Work, with direction</span></span>
          </Link>
          <button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"><X size={18} /></button>
        </div>
        <label className="relative mt-8 block sm:hidden">
          <span className="sr-only">Select demo role</span>
          <select data-testid="select-role-sidebar" value={role} onChange={(e) => setRole(e.target.value as Role)} className="focus-ring w-full appearance-none rounded-xl border border-sidebar-border bg-sidebar-accent px-3 py-3 text-xs font-bold text-sidebar-foreground outline-none">
            <option value="seeker">Job seeker view</option>
            <option value="recruiter">Recruiter view</option>
            <option value="admin">Admin view</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-sidebar-foreground/60" />
        </label>
        <div className="mt-10">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/45">{roleCopy[role].eyebrow}</p>
          <nav className="space-y-1">
            {nav.filter((item) => item.roles.includes(role)).map((item) => {
              const Icon = item.icon;
              const active = location === item.href || (item.href === '/dashboard' && location === '/');
              return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} onClick={() => setMobileOpen(false)} className={cn('group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-foreground')}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span>{active && <ArrowRight size={15} className="ml-auto" />}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
            <div className="mb-3 flex items-center justify-between text-[11px] text-sidebar-foreground/65"><span className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', health.isError ? 'bg-accent' : 'bg-sidebar-primary')} />Platform status</span><span>{health.isError ? 'Demo' : 'Live'}</span></div>
            <p className="text-xs leading-5 text-sidebar-foreground/80">A calmer way to move from browsing to belonging.</p>
          </div>
          <div className="flex items-center gap-3 border-t border-sidebar-border pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{roleCopy[role].avatar}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-sidebar-foreground">{role === 'admin' ? 'Nokari team' : role === 'recruiter' ? 'Aarav Mehta' : 'Maya Shah'}</p><p className="text-xs text-sidebar-foreground/55">{roleCopy[role].label}</p></div>
            <button data-testid="button-sign-out" aria-label="Sign out" onClick={() => notify('Demo mode keeps your workspace ready')} className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" data-testid="button-overlay-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" />}
      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/75 bg-background/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground lg:hidden"><Menu size={19} /></button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="font-mono-ui text-[10px] uppercase tracking-[0.2em]">Workspace</span><ChevronDown size={13} /></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative hidden sm:block"><span className="sr-only">Select demo role</span><select data-testid="select-role-header" value={role} onChange={(e) => setRole(e.target.value as Role)} className="focus-ring appearance-none rounded-xl border border-border bg-card py-2.5 pl-3 pr-9 text-xs font-bold text-foreground"><option value="seeker">Job seeker view</option><option value="recruiter">Recruiter view</option><option value="admin">Admin view</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 text-muted-foreground" /></label>
            <button data-testid="button-notifications" onClick={() => notify('You are all caught up')} className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground"><Activity size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /></button>
            <Link href="/settings" data-testid="link-header-settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{roleCopy[role].avatar}</Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  );
}

function DashboardPage({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const query = useGetDashboard({ role }, { query: { queryKey: getGetDashboardQueryKey({ role }), staleTime: 30_000 } });
  const data = (query.data ?? fallbackDashboard[role]) as DashboardData;
  return (
    <div className="rise-in">
      <div className="mb-9 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-[28px] bg-primary px-7 py-8 text-primary-foreground shadow-[0_20px_45px_hsl(161_45%_25%_/_0.16)] sm:px-10 sm:py-10">
          <div className="mb-10 flex items-center justify-between"><span className="rounded-full bg-primary-foreground/12 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]">Good to see you</span><span className="font-mono-ui text-[11px] text-primary-foreground/65">24.06 / SETU</span></div>
          <p className="mb-3 text-sm font-semibold text-primary-foreground/68">{formatRole(role)} dashboard</p>
          <h1 data-testid="text-dashboard-headline" className="max-w-xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.06em] sm:text-6xl">{query.isLoading ? 'Getting your workspace ready…' : data.headline}</h1>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/jobs" data-testid="link-dashboard-jobs" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5">Find your next step <ArrowRight size={16} /></Link><button data-testid="button-dashboard-notify" onClick={() => notify('Your workspace is up to date')} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-foreground/20 px-5 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10">What’s new <Sparkles size={15} /></button></div>
        </div>
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-secondary p-7 sm:p-9">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[18px] border-accent/25" /><div className="absolute -bottom-16 -right-1 h-48 w-48 rounded-full border-[1px] border-primary/20" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-primary">A small nudge</p>
          <h2 className="relative mt-5 max-w-xs font-display text-3xl font-semibold leading-tight tracking-[-0.05em]">Clarity compounds.</h2>
          <p className="relative mt-4 max-w-sm text-sm leading-6 text-foreground/65">Every useful detail in your profile gives the right people a better reason to start a conversation.</p>
          <Link href="/settings" data-testid="link-dashboard-profile" className="relative mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">Tune your profile <ArrowRight size={15} /></Link>
        </div>
      </div>
      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {query.isLoading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-32" />) : data.metrics.map((metric, index) => <div key={metric.label} data-testid={`metric-card-${index}`} className="card-lift rounded-2xl border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{metric.label}</span><Gauge size={16} className="text-primary/60" /></div><div className="flex items-end justify-between gap-3"><strong data-testid={`metric-value-${index}`} className="font-display text-3xl font-semibold tracking-[-0.05em]">{metric.value}</strong><span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', metric.tone === 'attention' ? 'bg-accent/20 text-foreground' : 'bg-primary/10 text-primary')}>{metric.change}</span></div></div>)}
      </div>
      {query.isError && <div className="mb-6"><ErrorState retry={() => query.refetch()} /></div>}
      <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <section><div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">The thread so far</p><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.04em]">Recent activity</h2></div><Link href="/settings" data-testid="link-activity-settings" className="text-xs font-bold text-primary hover:underline">Manage alerts</Link></div><div className="divide-y divide-border rounded-2xl border border-border bg-card">{data.activity.map((item) => <div key={item.id} data-testid={`activity-item-${item.id}`} className="flex gap-4 p-5"><div className={cn('mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', item.tone === 'attention' ? 'bg-accent/18 text-foreground' : item.tone === 'positive' ? 'bg-primary/12 text-primary' : 'bg-secondary text-muted-foreground')}><Activity size={16} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-bold">{item.title}</h3><span className="text-[11px] text-muted-foreground">{item.time}</span></div><p className="mt-1 text-sm text-muted-foreground">{item.detail}</p></div></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-card p-6"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Keep moving</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em]">Your next useful action</h2><div className="mt-6 space-y-3">{role === 'seeker' && <><QuickAction icon={UserRound} title="Complete your profile" detail="Add one detail to lift your match quality." href="/settings" /><QuickAction icon={Search} title="Explore fresh roles" detail="12 new roles match your preferences." href="/jobs" /></>}{role === 'recruiter' && <><QuickAction icon={Plus} title="Open a new role" detail="Bring the next great person into view." href="/jobs" /><QuickAction icon={FileCheck2} title="Review candidates" detail="12 applications are waiting on you." href="/applications" /></>}{role === 'admin' && <><QuickAction icon={ShieldCheck} title="Clear moderation queue" detail="5 items need a decision today." href="/users" /><QuickAction icon={BriefcaseBusiness} title="Audit live listings" detail="Keep the marketplace trustworthy." href="/jobs" /></>}</div></section>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, detail, href }: { icon: typeof Search; title: string; detail: string; href: string }) {
  return <Link href={href} data-testid={`link-action-${title.toLowerCase().replaceAll(' ', '-')}`} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/35 hover:bg-muted"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Icon size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{detail}</span></span><ArrowRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>;
}

function JobsPage({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [type, setType] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [applyJob, setApplyJob] = useState<JobData | null>(null);
  const [candidate, setCandidate] = useState('Maya Shah');
  const params = useMemo(() => ({ search: search || undefined, location: location === 'all' ? undefined : location, type: type === 'all' ? undefined : type }), [search, location, type]);
  const query = useListJobs(params, { query: { queryKey: getListJobsQueryKey(params), staleTime: 30_000 } });
  const createJob = useCreateJob();
  const createApplication = useCreateApplication();
  const jobs = ((query.data ?? fallbackJobs) as JobData[]).filter((job) => !search || `${job.title} ${job.company} ${job.location}`.toLowerCase().includes(search.toLowerCase())).filter((job) => location === 'all' || job.location.toLowerCase().includes(location.toLowerCase())).filter((job) => type === 'all' || job.type === type);
  const submitJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = { title: String(form.get('title')), company: String(form.get('company')), location: String(form.get('location')), type: String(form.get('type')), salary: String(form.get('salary')) };
    createJob.mutate({ data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() }); setShowCreate(false); notify('Your role is live in the marketplace'); }, onError: () => { const demoJob: JobData = { ...data, id: Date.now(), posted: 'Just now', applicants: 0, status: 'active' }; queryClient.setQueryData<JobData[]>(getListJobsQueryKey(params), (old = fallbackJobs) => [demoJob, ...old]); setShowCreate(false); notify('Role saved in demo mode for this session.'); } });
  };
  const submitApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!applyJob) return;
    createApplication.mutate({ data: { jobId: applyJob.id, candidate } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey({ role: 'seeker' }) }); setApplyJob(null); notify('Application sent. You can follow it from Applications.'); }, onError: () => { const demoApplication: ApplicationData = { id: Date.now(), jobTitle: applyJob.title, company: applyJob.company, candidate, submitted: 'Just now', status: 'pending', match: 88 }; queryClient.setQueryData<ApplicationData[]>(getListApplicationsQueryKey({ role: 'seeker' }), (old = fallbackApplications) => [demoApplication, ...old]); setApplyJob(null); notify('Demo application saved for this session.'); } });
  };
  return <div className="rise-in"><SectionHeading eyebrow="Opportunity board" title={role === 'recruiter' ? 'Roles you are shaping' : 'Find work that fits'} detail={role === 'recruiter' ? 'Publish a considered brief, then keep every candidate conversation moving.' : 'Search with intent. Save the roles that make you curious, not just the ones that match a keyword.'} action={role === 'recruiter' ? <Button data-testid="button-open-create-job" onClick={() => setShowCreate(true)}><Plus size={16} /> Post a role</Button> : <Link href="/applications" data-testid="link-view-applications" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold hover:border-primary/40">Track applications <ArrowRight size={15} /></Link>} />
    <div className="mb-7 rounded-2xl border border-border bg-card p-3 sm:p-4"><div className="grid gap-3 lg:grid-cols-[1.4fr_.75fr_.65fr_auto]"><label className="relative"><Search size={17} className="absolute left-3.5 top-3.5 text-muted-foreground" /><span className="sr-only">Search jobs</span><input data-testid="input-search-jobs" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, company, or keyword" className="focus-ring h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground/70" /></label><select data-testid="select-location-filter" value={location} onChange={(e) => setLocation(e.target.value)} className="focus-ring h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none"><option value="all">All locations</option><option value="Bengaluru">Bengaluru</option><option value="Remote">Remote</option><option value="Mumbai">Mumbai</option><option value="Pune">Pune</option></select><select data-testid="select-type-filter" value={type} onChange={(e) => setType(e.target.value)} className="focus-ring h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none"><option value="all">All work types</option><option value="Full-time">Full-time</option><option value="Contract">Contract</option></select><Button data-testid="button-apply-filters" variant="secondary" onClick={() => notify(`${jobs.length} roles match your filters`)}><Filter size={16} /> <span className="hidden sm:inline">Filter</span></Button></div></div>
    {query.isError && <div className="mb-6"><ErrorState retry={() => query.refetch()} /></div>}
    {query.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-32" />)}</div> : jobs.length === 0 ? <EmptyState title="No roles in this shape" detail="Try widening your search, or return when the right opportunity arrives." action={<Button variant="secondary" onClick={() => { setSearch(''); setLocation('all'); setType('all'); }}>Clear filters</Button>} /> : <div className="space-y-3">{jobs.map((job) => <JobCard key={job.id} job={job} role={role} onApply={() => setApplyJob(job)} onNotify={notify} />)}</div>}
    {showCreate && <Modal title="Publish a new role" onClose={() => setShowCreate(false)}><form onSubmit={submitJob} className="space-y-4"><Field name="title" label="Role title" placeholder="e.g. Senior Product Designer" required /><Field name="company" label="Company" placeholder="e.g. Katha Studio" required /><div className="grid gap-4 sm:grid-cols-2"><Field name="location" label="Location" placeholder="e.g. Bengaluru · Hybrid" required /><div><label className="mb-1.5 block text-xs font-bold text-muted-foreground">Work type</label><select name="type" data-testid="select-create-type" className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"><option>Full-time</option><option>Contract</option><option>Part-time</option></select></div></div><Field name="salary" label="Salary range" placeholder="e.g. ₹18–24L" required /><Button data-testid="button-submit-job" type="submit" disabled={createJob.isPending} className="w-full">{createJob.isPending ? 'Publishing…' : 'Publish role'} <ArrowRight size={16} /></Button></form></Modal>}
    {applyJob && <Modal title={`Apply to ${applyJob.title}`} onClose={() => setApplyJob(null)}><form onSubmit={submitApplication} className="space-y-5"><div className="rounded-xl bg-secondary p-4"><p className="text-sm font-bold">{applyJob.company}</p><p className="mt-1 text-xs text-muted-foreground">{applyJob.location} · {applyJob.salary}</p></div><Field name="candidate" label="Your name" value={candidate} onChange={(e) => setCandidate(e.target.value)} required /><p className="text-xs leading-5 text-muted-foreground">Your current profile will be shared with the recruiter. You can review the application after sending.</p><Button data-testid="button-submit-application" type="submit" disabled={createApplication.isPending} className="w-full">{createApplication.isPending ? 'Sending…' : 'Send application'} <ArrowRight size={16} /></Button></form></Modal>}
  </div>;
}

function JobCard({ job, role, onApply, onNotify }: { job: JobData; role: Role; onApply: () => void; onNotify: (message: string) => void }) {
  return <article data-testid={`card-job-${job.id}`} className="card-lift group rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary font-display text-xl font-semibold text-primary">{job.company.charAt(0)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-xl font-semibold tracking-[-0.035em]">{job.title}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">{job.company}</p></div><StatusPill value={job.status} /></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Globe2 size={14} />{job.location}</span><span className="flex items-center gap-1.5"><Clock3 size={14} />{job.type}</span><span className="font-bold text-foreground">{job.salary}</span></div></div><div className="flex shrink-0 items-center gap-2"><button data-testid={`button-job-menu-${job.id}`} onClick={() => onNotify('More role actions are coming to this workspace')} className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted"><MoreHorizontal size={18} /></button>{role === 'seeker' && job.status === 'active' && <Button data-testid={`button-apply-job-${job.id}`} onClick={onApply}>Apply <ArrowRight size={15} /></Button>}</div></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>Posted {job.posted}</span><span>{job.applicants} applicants</span></div></article>;
}

function ApplicationsPage({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [filter, setFilter] = useState('all');
  const params = useMemo(() => ({ role, status: filter === 'all' ? undefined : filter }), [role, filter]);
  const query = useListApplications(params, { query: { queryKey: getListApplicationsQueryKey(params), staleTime: 20_000 } });
  const update = useUpdateApplicationStatus();
  const apps = ((query.data ?? fallbackApplications) as ApplicationData[]).filter((app) => filter === 'all' || app.status === filter);
  const setStatus = (id: number, status: ApplicationStatus) => update.mutate({ id, data: { status } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey(params) }); notify(`Application marked ${status}`); }, onError: () => { queryClient.setQueryData<ApplicationData[]>(getListApplicationsQueryKey(params), (old = fallbackApplications) => old.map((app) => app.id === id ? { ...app, status } : app)); notify('Demo mode updated this application for the session.'); } });
  return <div className="rise-in"><SectionHeading eyebrow={role === 'recruiter' ? 'Hiring pipeline' : 'Your journey'} title={role === 'recruiter' ? 'Candidate applications' : 'Applications in motion'} detail={role === 'recruiter' ? 'Make the next decision visible, fair, and easy to act on.' : 'A simple view of every conversation you have started.'} action={<div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1"><button data-testid="button-filter-app-all" onClick={() => setFilter('all')} className={cn('rounded-lg px-3 py-2 text-xs font-bold', filter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>All</button><button data-testid="button-filter-app-pending" onClick={() => setFilter('pending')} className={cn('rounded-lg px-3 py-2 text-xs font-bold', filter === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Pending</button><button data-testid="button-filter-app-accepted" onClick={() => setFilter('accepted')} className={cn('rounded-lg px-3 py-2 text-xs font-bold', filter === 'accepted' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Accepted</button></div>} />
    {query.isError && <div className="mb-6"><ErrorState retry={() => query.refetch()} /></div>}{query.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-28" />)}</div> : apps.length === 0 ? <EmptyState title="Nothing here yet" detail="Once applications move, their story will appear in this space." action={<Link href="/jobs" data-testid="link-empty-applications" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Explore jobs <ArrowRight size={15} /></Link>} /> : <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="hidden grid-cols-[1.3fr_1fr_.65fr_.7fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:grid"><span>Role / candidate</span><span>Company</span><span>Match</span><span>Status</span><span /></div>{apps.map((app) => <div key={app.id} data-testid={`row-application-${app.id}`} className="grid gap-4 border-b border-border px-5 py-5 last:border-0 md:grid-cols-[1.3fr_1fr_.65fr_.7fr_auto] md:items-center"><div><p className="font-bold">{app.jobTitle}</p><p className="mt-1 text-xs text-muted-foreground">{role === 'recruiter' ? app.candidate : `Submitted ${app.submitted}`}</p></div><p className="text-sm text-muted-foreground">{app.company}</p><div><span className="font-mono-ui text-sm font-bold text-primary">{app.match}%</span><span className="ml-2 text-[11px] text-muted-foreground">match</span></div><StatusPill value={app.status} /><div className="flex gap-2 md:justify-end">{role === 'recruiter' ? <><Button data-testid={`button-accept-application-${app.id}`} variant="secondary" disabled={update.isPending} onClick={() => setStatus(app.id, 'accepted')} className="min-h-9 px-2.5 text-xs"><Check size={14} />Accept</Button><Button data-testid={`button-reject-application-${app.id}`} variant="danger" disabled={update.isPending} onClick={() => setStatus(app.id, 'rejected')} className="min-h-9 px-2.5 text-xs"><X size={14} />Reject</Button></> : <button data-testid={`button-application-details-${app.id}`} onClick={() => notify(`Showing the timeline for ${app.jobTitle}`)} className="text-xs font-bold text-primary hover:underline">View details</button>}</div></div>)}</div>}
  </div>;
}

function UsersPage({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState('all');
  const params = useMemo(() => ({ status: filter === 'all' ? undefined : filter }), [filter]);
  const query = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params), staleTime: 20_000 } });
  const update = useUpdateUserStatus();
  const users = ((query.data ?? fallbackUsers) as UserData[]).filter((user) => filter === 'all' || user.status === filter);
  const setStatus = (id: number, status: UserStatus) => update.mutate({ id, data: { status } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); notify(`User marked ${status}`); }, onError: () => { queryClient.setQueryData<UserData[]>(getListUsersQueryKey(params), (old = fallbackUsers) => old.map((user) => user.id === id ? { ...user, status } : user)); notify('Demo moderation action saved for this session.'); } });
  return <div className="rise-in"><SectionHeading eyebrow="Trust & safety" title="Keep the community useful" detail="Review new accounts and make the platform feel dependable for everyone who uses it." action={<div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1"><button data-testid="button-filter-users-all" onClick={() => setFilter('all')} className={cn('rounded-lg px-3 py-2 text-xs font-bold', filter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>All</button><button data-testid="button-filter-users-pending" onClick={() => setFilter('pending')} className={cn('rounded-lg px-3 py-2 text-xs font-bold', filter === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Needs review</button></div>} /><div className="mb-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Review queue</p><p className="mt-2 font-display text-3xl font-semibold">{users.filter((u) => u.status === 'pending').length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Accepted today</p><p className="mt-2 font-display text-3xl font-semibold text-primary">{users.filter((u) => u.status === 'accepted').length}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Removed</p><p className="mt-2 font-display text-3xl font-semibold text-muted-foreground">{users.filter((u) => u.status === 'removed').length}</p></div></div>{query.isError && <div className="mb-6"><ErrorState retry={() => query.refetch()} /></div>}{query.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)}</div> : users.length === 0 ? <EmptyState title="The queue is clear" detail="No one needs a moderation decision right now." /> : <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="hidden grid-cols-[1.2fr_1.2fr_.7fr_.75fr_auto] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground md:grid"><span>Member</span><span>Contact</span><span>Role</span><span>Status</span><span>Decision</span></div>{users.map((user) => <div key={user.id} data-testid={`row-user-${user.id}`} className="grid gap-4 border-b border-border px-5 py-5 last:border-0 md:grid-cols-[1.2fr_1.2fr_.7fr_.75fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-primary">{user.name.split(' ').map((part) => part[0]).join('')}</span><div><p className="font-bold">{user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">Joined {user.joined}</p></div></div><p className="truncate text-sm text-muted-foreground">{user.email}</p><p className="text-sm">{formatRole(user.role)}</p><StatusPill value={user.status} /><div className="flex gap-2">{user.status !== 'accepted' && <Button data-testid={`button-accept-user-${user.id}`} variant="secondary" disabled={update.isPending} onClick={() => setStatus(user.id, 'accepted')} className="min-h-9 px-2.5 text-xs"><Check size={14} />Accept</Button>}{user.status !== 'removed' && <Button data-testid={`button-remove-user-${user.id}`} variant="danger" disabled={update.isPending} onClick={() => setStatus(user.id, 'removed')} className="min-h-9 px-2.5 text-xs"><Trash2 size={14} />Remove</Button>}</div></div>)}</div>}</div>;
}

function SettingsPage({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [language, setLanguage] = useState('English');
  const [notifications, setNotifications] = useState({ role: true, digest: false, product: true });
  const [saved, setSaved] = useState(false);
  const toggle = (key: keyof typeof notifications) => setNotifications((current) => ({ ...current, [key]: !current[key] }));
  const save = () => { setSaved(true); notify('Your preferences are saved'); window.setTimeout(() => setSaved(false), 2200); };
  return <div className="rise-in max-w-4xl"><SectionHeading eyebrow="Your preferences" title="Make this workspace yours" detail="Choose the language, rhythm, and profile details that make NokariSetu useful every time you return." /><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><UserRound size={19} /></span><div><p className="font-bold">{role === 'admin' ? 'Nokari team' : role === 'recruiter' ? 'Aarav Mehta' : 'Maya Shah'}</p><p className="text-xs text-muted-foreground">{roleCopy[role].label} · Demo workspace</p></div></div><div className="mt-7 space-y-4"><Field name="profile-name" label="Display name" defaultValue={role === 'admin' ? 'Nokari team' : role === 'recruiter' ? 'Aarav Mehta' : 'Maya Shah'} /><Field name="profile-email" label="Email address" defaultValue={role === 'admin' ? 'team@nokarisetu.in' : role === 'recruiter' ? 'aarav@kathastudio.in' : 'maya.shah@mail.com'} type="email" /><Button data-testid="button-save-profile" variant="secondary" onClick={save} className="w-full">Save profile</Button></div></section><div className="space-y-6"><section className="rounded-2xl border border-border bg-card p-6"><div className="mb-5 flex items-center gap-3"><Globe2 size={18} className="text-primary" /><div><h2 className="font-display text-xl font-semibold">Language</h2><p className="text-xs text-muted-foreground">Your labels and guidance will follow this choice.</p></div></div><select data-testid="select-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"><option>English</option><option>हिन्दी</option><option>मराठी</option><option>বাংলা</option></select></section><section className="rounded-2xl border border-border bg-card p-6"><div className="mb-5 flex items-center gap-3"><Activity size={18} className="text-primary" /><div><h2 className="font-display text-xl font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">Useful signals only, never noise.</p></div></div><div className="divide-y divide-border">{([['role', 'Role updates', 'When an application or listing changes'], ['digest', 'Weekly digest', 'A quiet Monday view of what matters'], ['product', 'Product notes', 'Occasional tips from the NokariSetu team']] as const).map(([key, title, detail]) => <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><button data-testid={`button-toggle-${key}`} aria-pressed={notifications[key]} onClick={() => toggle(key)} className={cn('focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors', notifications[key] ? 'bg-primary' : 'bg-muted')}><span className={cn('absolute top-1 h-5 w-5 rounded-full bg-card shadow-sm transition-transform', notifications[key] ? 'translate-x-6' : 'translate-x-1')} /></button></div>)}</div></section><div className="flex items-center justify-between gap-4"><span className={cn('text-xs font-bold text-primary transition-opacity', saved ? 'opacity-100' : 'opacity-0')}>Saved just now</span><Button data-testid="button-save-settings" onClick={save}><Check size={16} />Save preferences</Button></div></div></div></div>;
}

function Field({ name, label, placeholder, required, defaultValue, value, onChange, type = 'text' }: { name: string; label: string; placeholder?: string; required?: boolean; defaultValue?: string; value?: string; onChange?: (event: ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return <div><label htmlFor={name} className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</label><input id={name} name={name} data-testid={`input-${name}`} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue} value={value} onChange={onChange} className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground/60" /></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div role="dialog" aria-modal="true" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-border bg-card p-6 shadow-2xl sm:rounded-[28px] sm:p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">NokariSetu</p><h2 className="font-display text-2xl font-semibold tracking-[-0.04em]">{title}</h2></div><button data-testid="button-close-modal" onClick={onClose} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div>{children}</div></div>;
}

function Router({ role, notify }: { role: Role; notify: (message: string) => void }) {
  return <Switch><Route path="/"><DashboardPage role={role} notify={notify} /></Route><Route path="/dashboard"><DashboardPage role={role} notify={notify} /></Route><Route path="/jobs"><JobsPage role={role} notify={notify} /></Route><Route path="/applications"><ApplicationsPage role={role} notify={notify} /></Route><Route path="/users"><UsersPage notify={notify} /></Route><Route path="/settings"><SettingsPage role={role} notify={notify} /></Route><Route component={NotFound} /></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [role, setRoleState] = useState<Role>(() => (window.localStorage.getItem('nokarisetu-role') as Role) || 'seeker');
  const [notice, setNotice] = useState('');
  const setRole = (nextRole: Role) => { setRoleState(nextRole); window.localStorage.setItem('nokarisetu-role', nextRole); setNotice(`${formatRole(nextRole)} view selected`); };
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 2800); return () => window.clearTimeout(timer); }, [notice]);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell role={role} setRole={setRole} notify={setNotice}><RoutedErrorBoundary><Router role={role} notify={setNotice} /></RoutedErrorBoundary></Shell></WouterRouter>{notice && <div data-testid="status-toast" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background shadow-xl"><Check size={17} className="text-accent" />{notice}</div>}<Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;