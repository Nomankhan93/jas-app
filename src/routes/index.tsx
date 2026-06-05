// src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HandHeart,
  HeartPulse,
  IdCard,
  Images,
  Newspaper,
  QrCode,
  Network,
  ScrollText,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

const portalStats = [
  { label: 'Portal Type', value: 'Member + Programs' },
  { label: 'Active Programs', value: 'Education · Health · Welfare · Employment' },
  { label: 'Donor System', value: 'Member Leaderboard' },
  { label: 'Digital System', value: 'QR Verified' },
]

const membershipSteps: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: 'Create Account', text: 'Signup with email or mobile OTP to start your membership application.', icon: UserPlus },
  { title: 'Submit Application', text: 'Fill personal details, district, taluka, address and upload photo.', icon: FileCheck2 },
  { title: 'Admin Review', text: 'JAS admin verifies the submitted application before approval.', icon: ClipboardCheck },
  { title: 'Digital Card', text: 'Approved members receive a QR-based digital membership card.', icon: IdCard },
]

const programModules: Array<{ title: string; text: string; to: string; badge: string; icon: LucideIcon }> = [
  { title: 'Membership Portal', text: 'Register as a JAS member, track approval and access your QR-based digital membership card.', to: '/signup', badge: 'Active', icon: IdCard },
  { title: 'Education & Skills Support', text: 'Apply for scholarship, fee support, books, uniform, exam fee, hostel, transport or skills training.', to: '/programs/education', badge: 'Active', icon: GraduationCap },
  { title: 'Health Assistance', text: 'Submit medical support cases with patient details, treatment information and private documents.', to: '/programs/health', badge: 'Active', icon: HeartPulse },
  { title: 'Welfare Case Support', text: 'Apply for financial help, ration support, widow/orphan support, emergency assistance and welfare cases.', to: '/programs/welfare', badge: 'Active', icon: HandHeart },
  { title: 'Employment Program', text: 'Register as a job seeker, upload CV, list skills and get reviewed by employment admins.', to: '/programs/employment', badge: 'Active', icon: BriefcaseBusiness },
  { title: 'Donation & Donor Leaderboard', text: 'Submit donation proof and view member-only top donors after finance verification.', to: '/donate', badge: 'Active', icon: BadgeIndianRupee },
]

const portalFeatures: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: 'Membership Registration', text: 'Focused registration flow for collecting member profile, location and photo details.', icon: FileCheck2 },
  { title: 'Education Applications', text: 'Verified members can apply for education support through membership number verification.', icon: GraduationCap },
  { title: 'Health Assistance Cases', text: 'Medical help cases can be submitted with private documents and reviewed by health admins.', icon: HeartPulse },
  { title: 'Welfare Case Tracking', text: 'Financial, ration, widow, orphan and emergency welfare cases remain linked to members.', icon: HandHeart },
  { title: 'Employment Profiles', text: 'Youth and job seekers can submit CVs, skills and placement preferences.', icon: BriefcaseBusiness },
  { title: 'Donor Leaderboard', text: 'Approved donations are verified and shown in a member-only leaderboard.', icon: Trophy },
]


const publicHighlights: Array<{ title: string; text: string; to: string; icon: LucideIcon }> = [
  {
    title: 'News & Announcements',
    text: 'Read official JAS updates, program notices and public announcements.',
    to: '/news',
    icon: Newspaper,
  },
  {
    title: 'Gallery',
    text: 'View program photos, meetings and community activity records.',
    to: '/gallery',
    icon: Images,
  },
  {
    title: 'Events',
    text: 'Follow upcoming meetings, public activities and organization events.',
    to: '/events',
    icon: CalendarDays,
  },
  {
    title: 'Public Committees',
    text: 'View central, divisional, district and taluka committee office bearers and public organization hierarchy.',
    to: '/committees',
    icon: Network,
  },
  {
    title: 'Manifesto & Constitution',
    text: 'Review the public manifesto, governance structure and official rules.',
    to: '/manifesto',
    icon: ScrollText,
  },
]

function HomePage() {
  return <main className="overflow-hidden"><div className="page-wrap flex flex-col gap-16 pb-24 pt-10 lg:gap-20 lg:pt-12"><HeroSection /><TrustStrip /><MembershipFlow /><ProgramGateway /><PortalFeatures /><PublicInformationHub /><FinalCTA /></div></main>
}

function HeroSection() {
  return (
    <section className="soft-panel animate-fade-up relative overflow-hidden rounded-[2rem] border-[#e8e0d1] bg-[linear-gradient(135deg,#fffdf8_0%,#f7f1e6_50%,#edf4ee_100%)] p-[clamp(1.5rem,4vw,3.5rem)] shadow-[0_30px_80px_rgba(11,42,29,0.10)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,145,44,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(11,42,29,0.10),transparent_30%)]" aria-hidden="true" />
      <AjrakPattern className="absolute right-[-2rem] top-[-2rem] h-64 w-64 opacity-[0.05]" />
      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div>
          <div className="animate-fade-up glass-strip inline-flex items-center gap-2.5 rounded-full border border-emerald-900/10 px-3.5 py-2 shadow-sm backdrop-blur"><span className="brand-dot" /><span className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">Official Member & Programs Portal</span></div>
          <p className="animate-fade-up delay-1 mt-7 text-[0.72rem] font-extrabold uppercase tracking-[0.24em] text-stone-500">Jatt Alliance Sindh · JAS</p>
          <h1 className="animate-fade-up delay-2 mt-4 max-w-[760px] text-[clamp(2.8rem,5.8vw,5.6rem)] font-black uppercase leading-[0.94] tracking-[-0.06em] text-stone-950">Jatt Alliance<br /><span className="text-[var(--forest)]">Sindh</span></h1>
          <div className="ajrak-rule animate-fade-in delay-2 my-6" />
          <p className="text-pretty animate-fade-up delay-3 m-0 max-w-[650px] text-[1.08rem] font-medium leading-8 text-stone-600">Digital platform for JAS membership registration, QR verification, digital member cards and verified community support programs including education, health, welfare, employment and donations.</p>
          <div className="animate-fade-up delay-4 mt-9 flex flex-wrap gap-3.5"><Link to="/signup" className="primary-btn pressable lift-hover">Apply for Membership <ArrowRight size={16} /></Link><Link to="/programs/employment" className="secondary-btn pressable lift-hover">Employment</Link><Link to="/donate" className="secondary-btn pressable lift-hover">Donate</Link><Link to="/donors" className="secondary-btn pressable lift-hover">Donor Leaderboard</Link></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{portalStats.map((item, index) => <div key={item.label} className={`soft-panel animate-fade-up ${getDelayClass(index)} rounded-[1.1rem] border-white/70 bg-white/72 px-4 py-3 shadow-sm backdrop-blur`}><p className="m-0 text-[0.66rem] font-extrabold uppercase tracking-[0.18em] text-stone-400">{item.label}</p><p className="mt-1 text-sm font-black text-stone-950">{item.value}</p></div>)}</div>
        </div>
        <div className="animate-scale-in delay-3 flex justify-center lg:justify-end"><PortalCardPreview /></div>
      </div>
    </section>
  )
}

function PortalCardPreview() { return <div className="lift-hover w-full max-w-[430px]"><div className="overflow-hidden rounded-[1.75rem] border border-emerald-950/15 bg-white shadow-[0_36px_90px_rgba(11,42,29,0.22)]"><div className="relative overflow-hidden bg-[linear-gradient(135deg,#06281b,#0b3a28,#115d46)] px-5 pb-6 pt-5 text-white"><AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" /><div className="relative flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-[#d8a949] bg-white p-0.5 shadow-xl"><img src="/jas/logo.jpeg" alt="Jatt Alliance Sindh logo" className="h-full w-full rounded-full object-cover" /></div><div><p className="m-0 text-[0.6rem] font-black uppercase tracking-[0.22em] text-[#f2d48f]">Digital Member ID</p><p className="mt-1 text-[0.92rem] font-extrabold uppercase tracking-[-0.01em] text-white">JATT ALLIANCE SINDH</p><p className="mt-1 text-[0.72rem] font-medium text-emerald-50/80">Official verified membership card</p></div></div><span className="badge-soft rounded-full bg-[#f2d48f] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wide text-emerald-950"><CheckCircle2 size={11} />Verified</span></div></div><div className="relative overflow-hidden bg-white p-5"><img src="/jas/logo.jpeg" alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.04]" /><div className="relative grid grid-cols-[96px_1fr] gap-4"><div><div className="flex h-24 w-24 items-center justify-center rounded-[1.35rem] border-4 border-white bg-slate-100 shadow-lg ring-2 ring-[#f2d48f]/70"><Users size={36} className="text-slate-300" /></div><div className="mt-3 rounded-[1rem] border border-[#f2d48f] bg-emerald-950 p-2.5 text-center"><p className="text-[0.55rem] font-black uppercase tracking-wide text-[#f2d48f]">Member No</p><p className="mt-1 text-[0.74rem] font-black text-white">JAS-2026-001</p></div></div><div><p className="text-[0.62rem] font-bold uppercase tracking-wide text-slate-500">Member Name</p><h3 className="mt-1 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-slate-950">Approved Member</h3><div className="mt-4 grid grid-cols-2 gap-3"><PreviewInfo label="Status" value="Approved" /><PreviewInfo label="Card" value="Active" /><PreviewInfo label="District" value="Sindh" /><PreviewInfo label="QR" value="Enabled" /></div></div></div><div className="soft-panel mt-5 flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 p-4"><div><p className="m-0 text-[0.65rem] font-black uppercase tracking-[0.18em] text-emerald-800">QR Verification</p><p className="mt-1 text-xs font-semibold text-slate-500">Scan to confirm membership</p></div><div className="soft-panel lift-hover rounded-xl bg-white p-2 shadow-sm"><QrCode size={42} color="#052e22" /></div></div></div><div className="border-t border-slate-200 bg-slate-50 px-5 py-3"><p className="m-0 text-[0.72rem] leading-5 text-slate-500">Digital ID is issued only after admin approval.</p></div></div><div className="soft-panel animate-fade-up delay-4 relative z-10 mx-auto -mt-4 flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-[0_14px_28px_rgba(15,23,42,0.08)]"><span className="text-[0.72rem] font-bold text-stone-600">Signup</span><ArrowRight size={10} className="text-stone-400" /><span className="text-[0.72rem] font-bold text-stone-600">Review</span><ArrowRight size={10} className="text-stone-400" /><span className="text-[0.72rem] font-bold text-emerald-900">Digital Card</span></div></div> }

function TrustStrip() { const items = ['Membership Registration','Admin Approval','Digital Card','QR Verification','Education Support','Health Assistance','Welfare Cases','Employment Support','Donor Leaderboard']; return <section className="glass-strip animate-fade-up rounded-[1.35rem] border border-[#e8e0d1] px-6 py-5 shadow-sm sm:px-8"><div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">{items.map((item) => <span key={item} className="inline-flex items-center gap-2 text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-stone-600"><span className="h-1.5 w-1.5 rounded-full bg-[#c4912c]" />{item}</span>)}</div></section> }

function MembershipFlow() { return <section className="animate-fade-up"><div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><p className="section-eyebrow mb-3">Membership Flow</p><h2 className="section-title text-balance">Membership process,<br />simple and verified</h2></div><p className="text-pretty m-0 max-w-md text-sm leading-7 text-stone-600">The core portal handles membership registration, approval, digital card access and public QR verification.</p></div><div className="grid gap-4 md:grid-cols-4">{membershipSteps.map((step, index) => { const Icon = step.icon; return <article key={step.title} className={`soft-panel animate-fade-up ${getDelayClass(index)} relative overflow-hidden rounded-[1.35rem] border border-[#e8e0d1] bg-white/90 p-5 shadow-sm`}><div className="mb-5 flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon size={20} /></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-500">{String(index + 1).padStart(2, '0')}</span></div><h3 className="text-xl font-black tracking-tight text-stone-950">{step.title}</h3><p className="mt-2 text-sm leading-7 text-stone-600">{step.text}</p>{index < membershipSteps.length - 1 ? <ArrowRight size={18} className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-stone-300 md:block" /> : null}</article> })}</div></section> }

function ProgramGateway() { return <section id="programs-gateway" className="animate-fade-up"><div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><p className="section-eyebrow mb-3">Program Gateway</p><h2 className="section-title text-balance">Member verified<br />community programs</h2></div><p className="text-pretty m-0 max-w-md text-sm leading-7 text-stone-600">Education, health, welfare and employment applications stay connected with approved JAS membership numbers.</p></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{programModules.map((program, index) => { const Icon = program.icon; return <article key={program.title} className={`feature-card group animate-fade-up ${getDelayClass(index)} p-7`}><div className="mb-5 flex items-start justify-between gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-[#9a6a12]"><Icon size={24} strokeWidth={1.8} /></div><span className="rounded-full bg-[#f2d48f]/45 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#5d4211]">{program.badge}</span></div><h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-stone-950">{program.title}</h3><p className="m-0 text-[0.92rem] leading-7 text-stone-600">{program.text}</p><Link to={program.to} className="jas-dark-action-link mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black no-underline transition">Open<ArrowRight size={15} /></Link></article> })}</div></section> }

function PortalFeatures() { return <section className="animate-fade-up"><div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><p className="section-eyebrow mb-3">Portal Features</p><h2 className="section-title text-balance">Built for digital<br />member support</h2></div><p className="text-pretty m-0 max-w-md text-sm leading-7 text-stone-600">The portal supports membership registration and focused community program workflows while keeping sensitive reviews restricted to authorized admins.</p></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{portalFeatures.map((feature, index) => { const Icon = feature.icon; return <article key={feature.title} className={`feature-card group animate-fade-up ${getDelayClass(index)} p-7`}><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon size={22} strokeWidth={1.75} /></div><h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-stone-950">{feature.title}</h3><p className="m-0 text-[0.92rem] leading-7 text-stone-600">{feature.text}</p></article> })}</div></section> }


function PublicInformationHub() {
  return (
    <section className="animate-fade-up">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="section-eyebrow mb-3">Public Website</p>
          <h2 className="section-title text-balance">
            Public updates,<br />records and transparency
          </h2>
        </div>
        <p className="text-pretty m-0 max-w-md text-sm leading-7 text-stone-600">
          Visitors can explore official JAS information, latest news, gallery
          records and events without logging in.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {publicHighlights.map((item, index) => {
          const Icon = item.icon
          return (
            <article
              key={item.title}
              className={`feature-card group animate-fade-up ${getDelayClass(index)} p-6`}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-emerald-900">
                <Icon size={22} strokeWidth={1.8} />
              </div>

              <h3 className="mb-2 mt-0 text-xl font-black tracking-tight text-stone-950">
                {item.title}
              </h3>

              <p className="m-0 text-[0.92rem] leading-7 text-stone-600">
                {item.text}
              </p>

              <Link
                to={item.to}
                className="mt-6 inline-flex items-center gap-2 text-sm font-black text-emerald-900 no-underline transition hover:text-[#9a6a12]"
              >
                Open
                <ArrowRight size={15} />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function FinalCTA() { return <section className="animate-fade-up relative overflow-hidden rounded-[2rem] bg-[linear-gradient(140deg,#0b1f14_0%,#14321e_50%,#0e2a1a_100%)] p-[clamp(2.5rem,6vw,5rem)] text-center shadow-[0_40px_100px_rgba(10,28,18,0.35)]"><AjrakPattern className="absolute inset-0 h-full w-full opacity-[0.05]" /><div className="relative z-10"><div className="badge-soft mb-5 border border-white/10 bg-white/5 px-3 py-1.5 text-[#f2d48f]"><ShieldCheck size={14} /><span className="text-[0.72rem] font-extrabold uppercase tracking-[0.24em]">Member Verified Portal</span></div><h2 className="display-title text-balance mx-auto mb-6 max-w-3xl text-[clamp(2.2rem,5vw,4rem)] leading-tight text-white">Apply, get approved,<br /><em className="text-[#d8a949]">access member support</em></h2><p className="text-pretty mx-auto mb-10 max-w-2xl text-base leading-8 text-white/70">Create your account, submit membership form, receive digital member ID and use verified services including education, health, welfare, employment and donation support.</p><div className="flex flex-wrap justify-center gap-4"><Link to="/signup" className="pressable lift-hover inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-[var(--r-lg)] bg-[linear-gradient(135deg,#c4912c,#ddb75d)] px-8 py-4 text-sm font-extrabold text-[#0B1F14] shadow-[0_10px_30px_rgba(176,125,42,0.4)]">Apply for Membership<ArrowRight size={16} /></Link><Link to="/programs/employment" className="ghost-btn pressable lift-hover">Employment</Link><Link to="/donate" className="ghost-btn pressable lift-hover">Donate</Link><Link to="/donors" className="ghost-btn pressable lift-hover">Donors</Link></div></div></section> }

function PreviewInfo({ label, value }: { label: string; value: string }) { return <div className="soft-panel lift-hover rounded-xl border border-slate-200 bg-white/90 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"><p className="m-0 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="m-0 mt-1 text-[0.78rem] font-bold text-slate-950">{value}</p></div> }
function AjrakPattern({ className = '' }: { className?: string }) { return <svg aria-hidden="true" className={`pointer-events-none ${className}`} width="320" height="320" viewBox="0 0 320 320" preserveAspectRatio="xMidYMid slice">{Array.from({ length: 8 }).map((_, row) => Array.from({ length: 8 }).map((_, column) => <rect key={`${row}-${column}`} x={column * 40 + 20} y={row * 40 + 20} width="12" height="12" transform={`rotate(45 ${column * 40 + 26} ${row * 40 + 26})`} fill="#1A4D2E" />))}</svg> }
function getDelayClass(index: number) { const delays = ['delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5']; return delays[index] ?? 'delay-5' }
