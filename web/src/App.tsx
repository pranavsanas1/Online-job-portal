import { type ComponentType, type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  Languages,
  LayoutDashboard,
  LibraryBig,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import {
  getGetHrDashboardQueryKey,
  getGetJobQueryKey,
  getHealthCheckQueryKey,
  getListCandidateApplicationsQueryKey,
  getListHrApplicationsQueryKey,
  getListJobsQueryKey,
  useCreateApplication,
  useCreateJob,
  useGetHrDashboard,
  useGetJob,
  useHealthCheck,
  useListCandidateApplications,
  useListHrApplications,
  useListJobs,
  useUpdateApplicationStatus,
  type Application,
  type ApplicationStatusUpdateStatus,
  type Job,
  type ListHrApplicationsParams,
  type ListJobsParams,
} from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type Language = 'en' | 'mr' | 'hi';
type Role = 'candidate' | 'hr';
type Session = { name: string; email: string; role: Role };

const copy = {
  en: {
    browse: 'Find work that feels like yours.', sub: 'Dream Job Portal connects people to honest opportunities — in the language that feels most natural.',
    explore: 'Explore opportunities', tracker: 'Track applications', hr: 'For HR teams', signIn: 'Sign in', candidateRole: 'I’m looking for work',
    employer: 'I’m hiring talent', name: 'Your name', email: 'Email address', continue: 'Continue as candidate', demo: 'Demo HR workspace',
    password: 'Demo password', enter: 'Enter HR workspace', jobs: 'Find jobs', applications: 'My applications', workspace: 'HR workspace',
    search: 'Search by role, company or skill', location: 'Location', all: 'All', filters: 'Filters', clear: 'Clear filters',
    apply: 'Apply now', save: 'Save changes', submit: 'Submit application', back: 'Back to jobs', cover: 'Why are you a good fit?',
    resume: 'Resume link', phone: 'Phone number', noJobs: 'No opportunities match yet.', noApps: 'Your application trail starts here.',
    review: 'Review applications', overview: 'Overview', newJobs: 'Post a new job', status: 'Status', candidate: 'Candidate',
    posted: 'Posted', view: 'View role', signOut: 'Sign out', language: 'Language', welcome: 'Welcome back',
  },
  mr: {
    browse: 'तुमच्यासाठी योग्य काम शोधा.', sub: 'नोकरीसेतू तुम्हाला विश्वासार्ह संधींशी जोडतो — तुमच्या आवडत्या भाषेत.',
    explore: 'संधी शोधा', tracker: 'अर्जांचा मागोवा', hr: 'एचआर टीमसाठी', signIn: 'साइन इन', candidateRole: 'मला काम हवे आहे',
    employer: 'मला टॅलेंट हवे आहे', name: 'तुमचे नाव', email: 'ईमेल पत्ता', continue: 'उमेदवार म्हणून पुढे जा', demo: 'डेमो एचआर वर्कस्पेस',
    password: 'डेमो पासवर्ड', enter: 'एचआर वर्कस्पेस उघडा', jobs: 'नोकऱ्या शोधा', applications: 'माझे अर्ज', workspace: 'एचआर वर्कस्पेस',
    search: 'भूमिका, कंपनी किंवा कौशल्य शोधा', location: 'ठिकाण', all: 'सर्व', filters: 'फिल्टर्स', clear: 'फिल्टर काढा',
    apply: 'आत्ताच अर्ज करा', save: 'बदल जतन करा', submit: 'अर्ज पाठवा', back: 'नोकऱ्यांकडे परत', cover: 'तुम्ही योग्य का आहात?',
    resume: 'रेझ्युमे लिंक', phone: 'फोन नंबर', noJobs: 'अजून जुळणाऱ्या संधी नाहीत.', noApps: 'तुमच्या अर्जांचा प्रवास इथून सुरू होतो.',
    review: 'अर्ज तपासा', overview: 'आढावा', newJobs: 'नवीन नोकरी पोस्ट करा', status: 'स्थिती', candidate: 'उमेदवार',
    posted: 'पोस्ट केले', view: 'भूमिका पहा', signOut: 'साइन आउट', language: 'भाषा', welcome: 'पुन्हा स्वागत आहे',
  },
  hi: {
    browse: 'अपने लिए सही काम खोजें.', sub: 'नौकरीसेतु आपको भरोसेमंद अवसरों से जोड़ता है — उस भाषा में जो आपको सबसे सहज लगे.',
    explore: 'अवसर खोजें', tracker: 'आवेदन ट्रैक करें', hr: 'एचआर टीमों के लिए', signIn: 'साइन इन', candidateRole: 'मुझे काम चाहिए',
    employer: 'मुझे टैलेंट चाहिए', name: 'आपका नाम', email: 'ईमेल पता', continue: 'उम्मीदवार के रूप में जारी रखें', demo: 'डेमो एचआर वर्कस्पेस',
    password: 'डेमो पासवर्ड', enter: 'एचआर वर्कस्पेस खोलें', jobs: 'नौकरियां खोजें', applications: 'मेरे आवेदन', workspace: 'एचआर वर्कस्पेस',
    search: 'भूमिका, कंपनी या कौशल खोजें', location: 'स्थान', all: 'सभी', filters: 'फ़िल्टर', clear: 'फ़िल्टर हटाएं',
    apply: 'अभी आवेदन करें', save: 'बदलाव सहेजें', submit: 'आवेदन भेजें', back: 'नौकरियों पर लौटें', cover: 'आप इस भूमिका के लिए सही क्यों हैं?',
    resume: 'रिज्यूमे लिंक', phone: 'फोन नंबर', noJobs: 'अभी कोई मेल खाता अवसर नहीं है.', noApps: 'आपके आवेदन का सफर यहां से शुरू होता है.',
    review: 'आवेदनों की समीक्षा', overview: 'अवलोकन', newJobs: 'नई नौकरी पोस्ट करें', status: 'स्थिति', candidate: 'उम्मीदवार',
    posted: 'पोस्ट किया', view: 'भूमिका देखें', signOut: 'साइन आउट', language: 'भाषा', welcome: 'वापसी पर स्वागत है',
  },
} as const;

function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('ns-language') as Language) || 'en');
  const setLanguage = (value: Language) => { setLanguageState(value); localStorage.setItem('ns-language', value); };
  return { language, setLanguage, t: copy[language] };
}

function useSession() {
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem('ns-session') || 'null') as Session | null; } catch { return null; }
  });
  const signIn = (next: Session) => { localStorage.setItem('ns-session', JSON.stringify(next)); setSession(next); };
  const signOut = () => { localStorage.removeItem('ns-session'); setSession(null); };
  return { session, signIn, signOut };
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
    <span className="grid size-10 place-items-center rounded-[13px] bg-accent text-primary shadow-warm"><span className="font-display text-2xl leading-none">न</span></span>
    {!compact && <span className="font-display text-2xl font-semibold tracking-tight">Dream<span className="text-accent">Job</span></span>}
  </Link>;
}

function LanguageMenu({ language, setLanguage, dark = false }: { language: Language; setLanguage: (v: Language) => void; dark?: boolean }) {
  return <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] ${dark ? 'text-background/70' : 'text-muted-foreground'}`}>
    <Languages className="size-4" /><span className="sr-only">Language</span>
    <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className={`cursor-pointer border-0 bg-transparent p-0 text-xs font-bold outline-none ${dark ? 'text-background' : 'text-foreground'}`} data-testid="select-language">
      <option value="en">English</option><option value="mr">मराठी</option><option value="hi">हिन्दी</option>
    </select>
  </label>;
}

function Shell({ children, language, setLanguage, session, signOut }: { children: ReactNode; language: Language; setLanguage: (v: Language) => void; session: Session | null; signOut: () => void }) {
  const [, setLocation] = useLocation();
  const t = copy[language];
  return <div className="min-h-[100dvh]">
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          <Link href="/jobs" className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-jobs">{t.jobs}</Link>
          {session?.role === 'candidate' && <Link href="/applications" className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-applications">{t.applications}</Link>}
          {session?.role === 'hr' && <Link href="/hr" className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-hr">{t.workspace}</Link>}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageMenu language={language} setLanguage={setLanguage} />
          {session ? <button onClick={() => { signOut(); setLocation('/'); }} className="hidden items-center gap-2 text-sm font-bold text-primary md:flex" data-testid="button-sign-out"><LogOut className="size-4" />{t.signOut}</button> : <Link href="/" className="hidden rounded-full border border-border px-4 py-2 text-sm font-bold hover:bg-muted md:block" data-testid="link-sign-in">{t.signIn}</Link>}
          <button className="rounded-xl p-2 hover:bg-muted md:hidden" onClick={() => setLocation('/jobs')} data-testid="button-mobile-menu"><Menu className="size-5" /></button>
        </div>
      </div>
    </header>
    {children}
    <footer className="border-t border-border/70 bg-primary text-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between lg:px-10">
        <div><Logo compact /><p className="mt-3 max-w-xs text-sm leading-6 text-background/60">A more human bridge between ambition and opportunity.</p></div>
        <div className="flex flex-wrap gap-5 text-sm text-background/60"><Link href="/jobs" className="hover:text-background" data-testid="footer-link-jobs">{t.jobs}</Link><Link href="/applications" className="hover:text-background" data-testid="footer-link-applications">{t.applications}</Link><span>Made for India</span></div>
      </div>
    </footer>
  </div>;
}

function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, testId }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: 'primary' | 'outline' | 'quiet'; disabled?: boolean; testId: string }) {
  const styles = { primary: 'bg-primary text-background shadow-warm hover:-translate-y-0.5 hover:bg-primary/90', outline: 'border border-primary/20 bg-card text-primary hover:-translate-y-0.5 hover:border-primary/50', quiet: 'text-muted-foreground hover:bg-muted hover:text-foreground' };
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`} data-testid={testId}>{children}</button>;
}

function StateCard({ kind, title, action }: { kind: 'loading' | 'error' | 'empty'; title: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center animate-fade" data-testid={`state-${kind}`}>
    {kind === 'loading' ? <div className="mb-4 flex gap-1.5"><span className="size-2 animate-pulse-soft rounded-full bg-accent" /><span className="size-2 animate-pulse-soft rounded-full bg-accent [animation-delay:.2s]" /><span className="size-2 animate-pulse-soft rounded-full bg-accent [animation-delay:.4s]" /></div> : kind === 'error' ? <CircleAlert className="mb-4 size-8 text-destructive" /> : <LibraryBig className="mb-4 size-8 text-muted-foreground" />}
    <p className="font-display text-xl">{title}</p>{action && <div className="mt-5">{action}</div>}
  </div>;
}

function Home({ language, setLanguage, signIn, session }: { language: Language; setLanguage: (v: Language) => void; signIn: (s: Session) => void; session: Session | null }) {
  const t = copy[language]; const [, setLocation] = useLocation(); const [role, setRole] = useState<Role>('candidate'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); setError(''); if (role === 'candidate' && name.trim() && email.trim()) { signIn({ name: name.trim(), email: email.trim(), role }); setLocation('/jobs'); } else if (role === 'hr' && name.trim() === 'Pranav Sanas' && password === '7208588853') { signIn({ name: 'Pranav Sanas', email: 'pranav@dreamjobportal.demo', role }); setLocation('/hr'); } else setError(role === 'hr' ? 'Use the demo name and password shown below.' : 'Add your name and email to continue.'); };
  return <main className="overflow-hidden">
    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-28 lg:pt-24">
      <div className="relative z-10 animate-rise"><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-primary"><Sparkles className="size-3.5" />A bridge to what’s next</div>
        <h1 className="max-w-3xl font-display text-6xl leading-[.95] tracking-[-.045em] text-primary sm:text-7xl lg:text-[6.8rem]">{t.browse}</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{t.sub}</p>
        <div className="mt-9 flex flex-wrap gap-3"><Button onClick={() => setLocation('/jobs')} testId="button-explore">{t.explore}<ArrowRight className="size-4" /></Button><Button onClick={() => setRole('hr')} variant="outline" testId="button-hr-entry"><Building2 className="size-4" />{t.hr}</Button></div>
        <div className="mt-12 flex items-center gap-8 border-t border-border pt-6"><div><strong className="font-mono-ui text-2xl">3</strong><span className="ml-2 text-xs text-muted-foreground">languages</span></div><div><strong className="font-mono-ui text-2xl">1</strong><span className="ml-2 text-xs text-muted-foreground">human bridge</span></div><LanguageMenu language={language} setLanguage={setLanguage} /></div>
      </div>
      <div className="relative animate-rise [animation-delay:.12s]">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-accent/25 blur-3xl" /><div className="relative overflow-hidden rounded-[2.5rem] bg-primary p-4 shadow-warm-lg">
          <div className="rounded-[2rem] border border-background/10 bg-primary/80 p-7 text-background"><div className="flex items-center justify-between"><span className="font-mono-ui text-xs text-background/55">SETU / 01</span><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">OPEN</span></div>
            <div className="my-20"><div className="mb-3 text-sm text-background/55">Your next chapter can start</div><div className="font-display text-5xl leading-none">A little<br /><span className="text-accent">closer.</span></div></div>
            <div className="flex items-end justify-between border-t border-background/15 pt-5"><span className="text-sm text-background/65">Built around real people<br />and real potential.</span><div className="grid size-14 place-items-center rounded-full border border-accent text-accent"><ArrowRight className="size-5 -rotate-45" /></div></div>
          </div>
        </div><div className="absolute -bottom-6 -left-5 rounded-2xl border border-border bg-card p-4 shadow-warm"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />MATCH FOUND</div><div className="font-display text-xl text-primary">Operations Associate</div><div className="mt-1 text-xs text-muted-foreground">Pune · Hybrid</div></div>
      </div>
    </section>
    <section className="border-y border-border/60 bg-secondary/60"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3 lg:px-10"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.15em] text-primary/50">01 — Discover</p><p className="mt-3 font-display text-2xl text-primary">Roles that speak your language</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Search by skill, city, or the kind of workday you want.</p></div><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.15em] text-primary/50">02 — Apply</p><p className="mt-3 font-display text-2xl text-primary">Your story, not just a resume</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Show teams what makes you a thoughtful fit.</p></div><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.15em] text-primary/50">03 — Move forward</p><p className="mt-3 font-display text-2xl text-primary">See what happens next</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Keep every application and update in one calm place.</p></div></div></section>
    <section className="mx-auto max-w-5xl px-5 py-16 lg:px-10"><div className="grid gap-8 rounded-[2rem] border border-border bg-card p-6 shadow-warm md:grid-cols-[.9fr_1.1fr] md:p-10"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.15em] text-primary/50">Your doorway</p><h2 className="mt-3 font-display text-4xl leading-tight text-primary">{role === 'hr' ? t.demo : t.welcome}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Choose how you’re joining Dream Job Portal today.</p><div className="mt-7 grid gap-2"><button onClick={() => setRole('candidate')} className={`flex items-center justify-between rounded-xl border p-4 text-left ${role === 'candidate' ? 'border-accent bg-accent/10' : 'border-border'}`} data-testid="button-role-candidate"><span><strong className="block text-sm">{t.candidateRole}</strong><small className="text-xs text-muted-foreground">Explore and apply</small></span>{role === 'candidate' && <Check className="size-4 text-primary" />}</button><button onClick={() => setRole('hr')} className={`flex items-center justify-between rounded-xl border p-4 text-left ${role === 'hr' ? 'border-accent bg-accent/10' : 'border-border'}`} data-testid="button-role-hr"><span><strong className="block text-sm">{t.employer}</strong><small className="text-xs text-muted-foreground">Review promising people</small></span>{role === 'hr' && <Check className="size-4 text-primary" />}</button></div></div>
      <form onSubmit={submit} className="flex flex-col justify-center gap-4 rounded-2xl bg-muted/60 p-5 md:p-7">{role === 'candidate' ? <><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.name}<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-accent" data-testid="input-candidate-name" /></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.email}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-accent" data-testid="input-candidate-email" /></label><Button type="submit" testId="button-candidate-submit">{t.continue}<ArrowRight className="size-4" /></Button></> : <><div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm leading-6 text-primary"><strong>{t.demo}</strong><br /><span className="text-xs text-muted-foreground">Name: Pranav Sanas · Password: 7208588853</span></div><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.name}<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pranav Sanas" className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-accent" data-testid="input-hr-name" /></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.password}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-accent" data-testid="input-hr-password" /></label><Button type="submit" testId="button-hr-submit">{t.enter}<ArrowRight className="size-4" /></Button></>}{error && <p className="text-sm font-semibold text-destructive" data-testid="text-login-error">{error}</p>}</form></div></section>
  </main>;
}

function JobCard({ job, onOpen }: { job: Job; onOpen: () => void }) {
  return <article className={`group rounded-2xl border bg-card p-5 shadow-warm transition hover:-translate-y-1 hover:border-accent ${job.featured ? 'border-accent/60' : 'border-border'}`} data-testid={`card-job-${job.id}`}><div className="flex items-start justify-between gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Building2 className="size-5" /></div><div className="flex flex-1 items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{job.company}</p><h3 className="mt-1 font-display text-2xl leading-tight text-primary">{job.title}</h3></div>{job.featured && <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary"><Star className="size-3 fill-current" />Featured</span>}</div></div><div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{job.location}</span><span>·</span><span>{job.workMode}</span><span>·</span><span>{job.jobType}</span></div><div className="mt-4 flex items-center justify-between border-t border-border pt-4"><span className="font-mono-ui text-xs font-bold text-primary">{job.salary}</span><Button onClick={onOpen} variant="quiet" testId={`button-view-job-${job.id}`}>View role <ArrowRight className="size-4" /></Button></div></article>;
}

function Jobs({ language, session }: { language: Language; session: Session | null }) {
  const t = copy[language]; const [, setLocation] = useLocation(); const [search, setSearch] = useState(''); const [category, setCategory] = useState(''); const [workMode, setWorkMode] = useState(''); const [jobType, setJobType] = useState(''); const params = useMemo(() => ({ search: search || undefined, category: category || undefined, workMode: (workMode || undefined) as ListJobsParams['workMode'], jobType: (jobType || undefined) as ListJobsParams['jobType'] }), [search, category, workMode, jobType]);
  const query = useListJobs(params, { query: { queryKey: getListJobsQueryKey(params) } }); const jobs = query.data || [];
  return <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.16em] text-primary/50">Dream Job Portal / Explore</p><h1 className="mt-3 font-display text-5xl tracking-tight text-primary md:text-6xl">{t.jobs}</h1><p className="mt-3 text-muted-foreground">Good work is closer than it looks.</p></div><div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" />{jobs.length} opportunities live</div></div>
    <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]"><aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-warm"><div className="flex items-center justify-between"><h2 className="font-display text-xl text-primary">{t.filters}</h2><Filter className="size-4 text-muted-foreground" /></div><div className="mt-6 space-y-5"><label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.location}<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none" data-testid="select-category"><option value="">{t.all} categories</option><option>Design</option><option>Engineering</option><option>Operations</option><option>Sales</option><option>Marketing</option></select></label><label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Work mode<select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none" data-testid="select-work-mode"><option value="">{t.all}</option><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Job type<select value={jobType} onChange={(e) => setJobType(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none" data-testid="select-job-type"><option value="">{t.all}</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label><Button onClick={() => { setSearch(''); setCategory(''); setWorkMode(''); setJobType(''); }} variant="quiet" testId="button-clear-filters">{t.clear}</Button></div></aside>
      <section><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-accent" data-testid="input-job-search" /></div><Button onClick={() => setSearch(search.trim())} testId="button-search-jobs"><Search className="size-4" />Search</Button></div>{query.isLoading ? <div className="grid gap-4 md:grid-cols-2"><StateCard kind="loading" title="Finding the right openings" /><StateCard kind="loading" title="Reading the latest roles" /></div> : query.isError ? <StateCard kind="error" title="We couldn't load jobs right now." action={<Button onClick={() => query.refetch()} testId="button-retry-jobs">Try again</Button>} /> : jobs.length === 0 ? <StateCard kind="empty" title={t.noJobs} action={<Button onClick={() => { setSearch(''); setCategory(''); setWorkMode(''); setJobType(''); }} variant="outline" testId="button-reset-jobs">{t.clear}</Button>} /> : <div className="grid gap-4 md:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} onOpen={() => setLocation(`/jobs/${job.id}`)} />)}</div>}</section></div>
  </main>;
}

function ApplyDialog({ job, session, onClose, language }: { job: Job; session: Session | null; onClose: () => void; language: Language }) {
  const t = copy[language]; const qc = useQueryClient(); const mutation = useCreateApplication(); const [form, setForm] = useState({ name: session?.name || '', email: session?.email || '', phone: '', resumeUrl: '', coverNote: '' }); const [done, setDone] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); mutation.mutate({ data: { jobId: job.id, candidateName: form.name, candidateEmail: form.email, phone: form.phone, resumeUrl: form.resumeUrl, coverNote: form.coverNote } }, { onSuccess: () => { setDone(true); qc.invalidateQueries({ queryKey: getListCandidateApplicationsQueryKey({ candidateEmail: form.email }) }); } }); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-primary/50 p-4 backdrop-blur-sm animate-fade"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-warm-lg md:p-8"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-wider text-primary/50">Application / {job.company}</p><h2 className="mt-2 font-display text-3xl text-primary">{done ? 'Application received.' : job.title}</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-muted" data-testid="button-close-apply"><X className="size-5" /></button></div>{done ? <div className="py-12 text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-7" /></div><p className="mt-5 text-muted-foreground">Your application is now with the HR team. You can follow its progress in My applications.</p><div className="mt-6"><Button onClick={onClose} testId="button-close-success">Done</Button></div></div> : <form onSubmit={submit} className="mt-7 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.name}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-application-name" /></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.email}<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-application-email" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.phone}<input required minLength={8} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-application-phone" /></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.resume}<input required value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-application-resume" /></label></div><label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.cover}<textarea required minLength={20} rows={5} value={form.coverNote} onChange={(e) => setForm({ ...form, coverNote: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-application-cover" /></label>{mutation.isError && <p className="text-sm font-semibold text-destructive">We couldn't send that yet. Check your details and try again.</p>}<Button type="submit" disabled={mutation.isPending} testId="button-submit-application">{mutation.isPending ? <><Loader2 className="size-4 animate-spin" />Sending</> : <><Send className="size-4" />{t.submit}</>}</Button></form>}</div></div>;
}

function JobDetail({ language, session }: { language: Language; session: Session | null }) {
  const { id } = useParams<{ id: string }>(); const t = copy[language]; const [showApply, setShowApply] = useState(false); const jobQuery = useGetJob(Number(id), { query: { queryKey: getGetJobQueryKey(Number(id)) } }); const job = jobQuery.data;
  if (jobQuery.isLoading) return <main className="mx-auto max-w-4xl px-5 py-16"><StateCard kind="loading" title="Opening this role" /></main>;
  if (jobQuery.isError || !job) return <main className="mx-auto max-w-4xl px-5 py-16"><StateCard kind="error" title="This role is no longer available." action={<Link href="/jobs" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-background" data-testid="link-back-jobs">{t.back}</Link>} /></main>;
  return <main className="mx-auto max-w-5xl px-5 py-12 lg:px-10 lg:py-16"><Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary" data-testid="link-back-to-jobs"><ArrowRight className="size-4 rotate-180" />{t.back}</Link><div className="mt-8 rounded-[2rem] border border-border bg-card p-6 shadow-warm md:p-10"><div className="flex flex-col justify-between gap-6 md:flex-row"><div><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">{job.category}</span><h1 className="mt-5 max-w-3xl font-display text-5xl leading-none tracking-tight text-primary md:text-6xl">{job.title}</h1><p className="mt-4 text-lg font-semibold text-muted-foreground">{job.company}</p></div><div className="flex shrink-0 items-start"><Button onClick={() => { if (session?.role === 'candidate') setShowApply(true); else window.alert('Please sign in as a candidate to apply.'); }} testId="button-apply-detail">{t.apply}<ArrowRight className="size-4" /></Button></div></div><div className="mt-10 grid gap-3 border-y border-border py-5 sm:grid-cols-3"><div className="flex items-center gap-3 text-sm"><MapPin className="size-4 text-accent" /><span>{job.location}</span></div><div className="flex items-center gap-3 text-sm"><BriefcaseBusiness className="size-4 text-accent" /><span>{job.workMode} · {job.jobType}</span></div><div className="flex items-center gap-3 text-sm"><Clock3 className="size-4 text-accent" /><span>{job.salary}</span></div></div><div className="mt-10 grid gap-10 md:grid-cols-[1.3fr_.7fr]"><div><h2 className="font-display text-3xl text-primary">The role</h2><p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-muted-foreground">{job.description}</p></div><aside><h2 className="font-display text-3xl text-primary">You’ll bring</h2><div className="mt-4 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full border border-border bg-muted px-3 py-2 text-xs font-bold text-primary">{skill}</span>)}</div><div className="mt-8 rounded-2xl bg-secondary/70 p-5"><p className="font-mono-ui text-xs uppercase tracking-wider text-primary/60">{t.posted}</p><p className="mt-2 text-sm font-semibold text-primary">{new Date(job.postedAt).toLocaleDateString()}</p></div></aside></div></div>{showApply && <ApplyDialog job={job} session={session} language={language} onClose={() => setShowApply(false)} />}</main>;
}

function Applications({ language, session }: { language: Language; session: Session | null }) {
  const t = copy[language]; const email = session?.email || ''; const query = useListCandidateApplications({ candidateEmail: email || 'guest@example.com' }, { query: { enabled: Boolean(email), queryKey: getListCandidateApplicationsQueryKey({ candidateEmail: email || 'guest@example.com' }) } }); const apps = query.data || [];
  return <main className="mx-auto max-w-6xl px-5 py-12 lg:px-10 lg:py-16"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.16em] text-primary/50">Dream Job Portal / Your trail</p><h1 className="mt-3 font-display text-5xl tracking-tight text-primary">{t.applications}</h1><p className="mt-3 text-muted-foreground">Every thoughtful application deserves a clear next step.</p></div><Link href="/jobs" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-background" data-testid="link-find-more-jobs">{t.jobs}<ArrowRight className="size-4" /></Link></div>{!session ? <div className="mt-10"><StateCard kind="empty" title="Sign in to see your application trail." action={<Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-background" data-testid="link-sign-in-applications">{t.signIn}</Link>} /></div> : query.isLoading ? <div className="mt-10"><StateCard kind="loading" title="Gathering your applications" /></div> : query.isError ? <div className="mt-10"><StateCard kind="error" title="We couldn't load your applications." action={<Button onClick={() => query.refetch()} testId="button-retry-applications">Try again</Button>} /></div> : apps.length === 0 ? <div className="mt-10"><StateCard kind="empty" title={t.noApps} action={<Link href="/jobs" className="inline-flex min-h-11 items-center rounded-xl border border-primary/20 bg-card px-5 text-sm font-bold text-primary" data-testid="link-start-applying">{t.explore}</Link>} /></div> : <div className="mt-10 space-y-3">{apps.map((app) => <ApplicationRow key={app.id} application={app} />)}</div>}</main>;
}

function ApplicationRow({ application }: { application: Application }) {
  const colors: Record<string, string> = { New: 'bg-sky-100 text-sky-800', Reviewing: 'bg-amber-100 text-amber-800', Shortlisted: 'bg-emerald-100 text-emerald-800', Rejected: 'bg-rose-100 text-rose-800', Hired: 'bg-primary text-background' };
  return <article className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-warm md:grid-cols-[1fr_auto] md:items-center" data-testid={`row-application-${application.id}`}><div><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><FileCheck2 className="size-5" /></div><div><h2 className="font-display text-2xl text-primary">{application.jobTitle}</h2><p className="text-sm text-muted-foreground">{application.company}</p></div></div><p className="mt-4 text-xs text-muted-foreground">Applied {new Date(application.appliedAt).toLocaleDateString()}</p></div><span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold ${colors[application.status] || 'bg-muted text-primary'}`} data-testid={`status-application-${application.id}`}>{application.status}</span></article>;
}

function Hr({ language }: { language: Language }) {
  const t = copy[language]; const qc = useQueryClient(); const [status, setStatus] = useState(''); const [showJob, setShowJob] = useState(false); const dash = useGetHrDashboard({ query: { queryKey: getGetHrDashboardQueryKey() } }); const hrParams = useMemo(() => status ? { status: status as ListHrApplicationsParams['status'] } : undefined, [status]); const appsQuery = useListHrApplications(hrParams, { query: { queryKey: getListHrApplicationsQueryKey(hrParams) } }); const update = useUpdateApplicationStatus(); const create = useCreateJob();
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '', workMode: 'Hybrid', jobType: 'Full-time', category: 'Operations', salary: '', description: '', skills: '' });
  const data = dash.data; const apps = appsQuery.data || data?.recentApplications || [];
  const metrics: Array<{ label: string; value: number | undefined; Icon: ComponentType<{ className?: string }> }> = [{ label: 'Total jobs', value: data?.totalJobs, Icon: BriefcaseBusiness }, { label: 'Applications', value: data?.totalApplications, Icon: FileCheck2 }, { label: 'New today', value: data?.newApplications, Icon: Sparkles }, { label: 'Shortlisted', value: data?.shortlisted, Icon: Users }];
  const submitJob = (e: FormEvent) => { e.preventDefault(); create.mutate({ data: { ...jobForm, skills: jobForm.skills.split(',').map((s) => s.trim()).filter(Boolean) } as never }, { onSuccess: () => { setShowJob(false); qc.invalidateQueries({ queryKey: getListJobsQueryKey() }); setJobForm({ title: '', company: '', location: '', workMode: 'Hybrid', jobType: 'Full-time', category: 'Operations', salary: '', description: '', skills: '' }); } }); };
  const changeStatus = (id: number, next: ApplicationStatusUpdateStatus) => update.mutate({ id, data: { status: next } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListHrApplicationsQueryKey(hrParams) }); qc.invalidateQueries({ queryKey: getGetHrDashboardQueryKey() }); } });
  return <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-[.16em] text-primary/50">Dream Job Portal / HR</p><h1 className="mt-3 font-display text-5xl tracking-tight text-primary">{t.overview}</h1><p className="mt-3 text-muted-foreground">A clear view of people who could move your team forward.</p></div><Button onClick={() => setShowJob(true)} testId="button-open-job-form"><Plus className="size-4" />{t.newJobs}</Button></div><div className="mt-10 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-primary"><strong>Demo workspace</strong><span className="ml-2 text-muted-foreground">You’re viewing a presentation-ready HR account. This is not production security.</span></div>{dash.isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((n) => <StateCard key={n} kind="loading" title="Loading metric" />)}</div> : dash.isError ? <div className="mt-8"><StateCard kind="error" title="Dashboard metrics are taking a moment." action={<Button onClick={() => dash.refetch()} testId="button-retry-dashboard">Try again</Button>} /></div> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value: metricValue, Icon }, i) => <div key={label} className={`rounded-2xl border border-border bg-card p-5 shadow-warm ${i === 2 ? 'bg-secondary' : ''}`} data-testid={`metric-${label.replace(' ', '-')}`}><div className="flex justify-between"><span className="text-sm font-semibold text-muted-foreground">{label}</span><Icon className="size-5 text-accent" /></div><p className="mt-8 font-mono-ui text-4xl font-bold text-primary">{metricValue ?? '—'}</p></div>)}</div>}<section className="mt-12"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-3xl text-primary">{t.review}</h2><p className="mt-1 text-sm text-muted-foreground">Move each application to its clearest next step.</p></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none" data-testid="select-application-status"><option value="">All applications</option><option>New</option><option>Reviewing</option><option>Shortlisted</option><option>Rejected</option><option>Hired</option></select></div>{appsQuery.isLoading ? <div className="mt-6"><StateCard kind="loading" title="Loading applications" /></div> : appsQuery.isError ? <div className="mt-6"><StateCard kind="error" title="Applications are unavailable." action={<Button onClick={() => appsQuery.refetch()} testId="button-retry-hr-apps">Try again</Button>} /></div> : apps.length === 0 ? <div className="mt-6"><StateCard kind="empty" title="No applications in this view." /></div> : <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-warm"><div className="hidden grid-cols-[1.3fr_1fr_.8fr_1.5fr] gap-4 border-b border-border bg-muted/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>{t.candidate}</span><span>Role</span><span>{t.status}</span><span>Next step</span></div>{apps.map((app) => <div key={app.id} className="grid gap-4 border-b border-border p-5 last:border-0 md:grid-cols-[1.3fr_1fr_.8fr_1.5fr] md:items-center md:px-5" data-testid={`row-hr-application-${app.id}`}><div><p className="font-bold text-primary">{app.candidateName}</p><p className="mt-1 text-xs text-muted-foreground">{app.candidateEmail}</p></div><div><p className="font-semibold text-primary">{app.jobTitle}</p><p className="mt-1 text-xs text-muted-foreground">{app.company}</p></div><span className="w-fit rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">{app.status}</span><div className="flex flex-wrap gap-2"><Button onClick={() => changeStatus(app.id, 'Reviewing')} disabled={app.status === 'Reviewing' || update.isPending} variant="outline" testId={`button-review-${app.id}`}>Review</Button><Button onClick={() => changeStatus(app.id, 'Shortlisted')} disabled={app.status === 'Shortlisted' || update.isPending} variant="primary" testId={`button-shortlist-${app.id}`}>Shortlist</Button><Button onClick={() => changeStatus(app.id, 'Rejected')} disabled={app.status === 'Rejected' || update.isPending} variant="quiet" testId={`button-reject-${app.id}`}>Reject</Button></div></div>)}</div>}</section>{showJob && <div className="fixed inset-0 z-50 grid place-items-center bg-primary/50 p-4 backdrop-blur-sm"><form onSubmit={submitJob} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-warm-lg md:p-8"><div className="flex items-start justify-between"><div><p className="font-mono-ui text-xs font-bold uppercase tracking-wider text-primary/50">HR / Publish</p><h2 className="mt-2 font-display text-3xl text-primary">{t.newJobs}</h2></div><button type="button" onClick={() => setShowJob(false)} className="rounded-full p-2 hover:bg-muted" data-testid="button-close-job-form"><X className="size-5" /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2">{[['title', 'Job title'], ['company', 'Company'], ['location', 'Location'], ['salary', 'Salary range'], ['category', 'Category'], ['skills', 'Skills (comma separated)']].map(([key, label]) => <label key={key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}<input required value={jobForm[key as keyof typeof jobForm]} onChange={(e) => setJobForm({ ...jobForm, [key]: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid={`input-job-${key}`} /></label>)}<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Work mode<select value={jobForm.workMode} onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" data-testid="select-new-job-mode"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job type<select value={jobForm.jobType} onChange={(e) => setJobForm({ ...jobForm, workMode: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" data-testid="select-new-job-mode"><option>Remote</option><option>Hybrid</option><option>On-site</option></select></label><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job type<select value={jobForm.jobType} onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm" data-testid="select-new-job-type"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label></div><label className="mt-4 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description<textarea required minLength={20} rows={5} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" data-testid="input-job-description" /></label><div className="mt-6 flex justify-end gap-3"><Button onClick={() => setShowJob(false)} variant="quiet" testId="button-cancel-job">Cancel</Button><Button type="submit" disabled={create.isPending} testId="button-submit-job">{create.isPending ? 'Publishing…' : 'Publish job'}<ArrowRight className="size-4" /></Button></div></form></div>}</main>;
}

function Router({ language, setLanguage, session, signIn, signOut }: { language: Language; setLanguage: (v: Language) => void; session: Session | null; signIn: (s: Session) => void; signOut: () => void }) {
  useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  return <Shell language={language} setLanguage={setLanguage} session={session} signOut={signOut}><ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/"><Home language={language} setLanguage={setLanguage} signIn={signIn} session={session} /></Route><Route path="/jobs"><Jobs language={language} session={session} /></Route><Route path="/jobs/:id"><JobDetail language={language} session={session} /></Route><Route path="/applications"><Applications language={language} session={session} /></Route><Route path="/hr">{session?.role === 'hr' ? <Hr language={language} /> : <Home language={language} setLanguage={setLanguage} signIn={signIn} session={session} />}</Route><Route component={NotFound} /></Switch></ErrorBoundary></Shell>;
}

function App() {
  const { language, setLanguage } = useLanguage(); const { session, signIn, signOut } = useSession();
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router language={language} setLanguage={setLanguage} session={session} signIn={signIn} signOut={signOut} /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;