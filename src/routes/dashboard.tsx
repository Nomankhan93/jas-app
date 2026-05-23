import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  IdCard,
  LogOut,
  Pencil,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

// ── Brand tokens ────────────────────────────────────────────────────────────
const G = '#0C2B1C'
const GM = '#1A4530'
const GOLD = '#C4912C'
const GOLD_LT = '#FBF0D9'
const CREAM = '#F6F3EC'

// ── Types ────────────────────────────────────────────────────────────────────
type Member = {
  id: string
  user_id: string
  member_no: string | null
  full_name: string
  father_name: string
  cnic: string
  mobile: string
  district: string
  taluka: string | null
  profession: string | null
  caste_branch: string | null
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  address: string | null
  date_of_birth: string | null
  gender: string | null
  education: string | null
  blood_group: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_mobile: string | null
  declaration_accepted: boolean
}

type StatusStep = {
  key: string
  label: string
  sub: (member: Member) => string
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'submitted',
    label: 'Form submitted',
    sub: (m) => formatDate(m.created_at),
  },
  {
    key: 'review',
    label: 'Admin review',
    sub: (m) => {
      if (m.status === 'approved') return 'Completed'
      if (m.status === 'rejected') return 'Rejected'
      return 'In progress'
    },
  },
  {
    key: 'approval',
    label: 'Approval & ID issue',
    sub: (m) => {
      if (m.status === 'approved')
        return m.approved_at ? `Approved ${formatDate(m.approved_at)}` : 'Approved'
      if (m.status === 'rejected') return 'Not approved'
      return 'Awaiting approval'
    },
  },
  {
    key: 'card',
    label: 'Digital card ready',
    sub: (m) => {
      if (m.status === 'approved' && m.member_no) return 'Ready to download'
      if (m.status === 'rejected') return 'Unavailable'
      return 'After approval'
    },
  },
]

function getActiveStep(m: Member) {
  if (m.status === 'pending' || m.status === 'rejected') return 1
  if (m.status === 'approved') return m.member_no ? 3 : 2
  return 0
}

const DASHBOARD_CSS = `
@keyframes jas-spin {
  to { transform: rotate(360deg); }
}

.jas-dashboard,
.jas-dashboard * {
  box-sizing: border-box;
}

.jas-dashboard {
  min-height: 100vh;
  font-family: 'Raleway', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #1c1917;
  background:
    radial-gradient(circle at top left, rgba(196,145,44,0.20), transparent 32rem),
    radial-gradient(circle at top right, rgba(12,43,28,0.16), transparent 30rem),
    ${CREAM};
}

.jas-topbar {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(12,43,28,0.98), rgba(26,69,48,0.96)),
    ${G};
  border-bottom: 1px solid rgba(255,255,255,0.10);
}

.jas-topbar::after {
  content: '';
  position: absolute;
  inset: auto -10% -55% auto;
  width: 34rem;
  height: 34rem;
  border-radius: 999px;
  background: rgba(196,145,44,0.12);
  pointer-events: none;
}

.jas-container {
  width: min(1160px, calc(100% - 40px));
  margin: 0 auto;
}

.jas-nav {
  position: relative;
  z-index: 1;
  min-height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.jas-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.jas-brand-mark {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}

.jas-brand-title {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  color: white;
}

.jas-brand-subtitle {
  margin: 6px 0 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.52);
}

.jas-logout {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: white;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.jas-logout:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.13);
  border-color: rgba(255,255,255,0.28);
}

.jas-content {
  padding: 34px 0 48px;
}

.jas-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${CREAM};
  font-family: 'Raleway', system-ui, sans-serif;
}

.jas-loading-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-radius: 18px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(12,43,28,0.08);
  box-shadow: 0 18px 45px rgba(12,43,28,0.08);
  color: ${GM};
}

.jas-spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid ${GOLD};
  border-top-color: transparent;
  animation: jas-spin 0.75s linear infinite;
}

.jas-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  font-size: 13px;
  line-height: 1.55;
  box-shadow: 0 12px 30px rgba(159,18,57,0.08);
}

.jas-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,251,242,0.92)),
    white;
  border: 1px solid rgba(12,43,28,0.09);
  box-shadow: 0 22px 60px rgba(12,43,28,0.10);
}

.jas-hero::after {
  content: '';
  position: absolute;
  right: -5rem;
  top: -7rem;
  width: 22rem;
  height: 22rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(196,145,44,0.20), transparent 65%);
  pointer-events: none;
}

.jas-hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
}

.jas-hero-copy {
  min-width: 0;
}

.jas-eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${GOLD};
}

.jas-hero h1 {
  margin: 8px 0 8px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(34px, 5vw, 48px);
  line-height: 0.95;
  color: ${G};
  letter-spacing: -0.02em;
}

.jas-hero-text {
  max-width: 680px;
  margin: 0;
  color: #71695f;
  font-size: 14px;
  line-height: 1.75;
}

.jas-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.jas-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(12,43,28,0.06);
  border: 1px solid rgba(12,43,28,0.08);
  color: ${G};
  font-size: 12px;
  font-weight: 700;
}

.jas-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 336px;
  gap: 20px;
  align-items: start;
}

.jas-card {
  border-radius: 24px;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(12,43,28,0.09);
  box-shadow: 0 16px 46px rgba(12,43,28,0.075);
  overflow: hidden;
}

.jas-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid #efe9df;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(251,248,242,0.92));
}

.jas-card-title {
  margin: 4px 0 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 24px;
  line-height: 1;
  font-weight: 700;
  color: ${G};
}

.jas-card-body {
  padding: 24px;
}

.jas-profile-intro {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-bottom: 22px;
}

.jas-avatar-wrap {
  position: relative;
  width: 112px;
  height: 112px;
}

.jas-avatar,
.jas-avatar-fallback {
  width: 112px;
  height: 112px;
  border-radius: 28px;
  border: 4px solid white;
  box-shadow:
    0 14px 30px rgba(12,43,28,0.14),
    0 0 0 1px rgba(12,43,28,0.10);
}

.jas-avatar {
  object-fit: cover;
}

.jas-avatar-fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f2eee6, #fffaf0);
}

.jas-verified-dot {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #059669;
  border: 3px solid white;
  box-shadow: 0 8px 18px rgba(5,150,105,0.25);
}

.jas-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(178px, 1fr));
  gap: 14px;
}

.jas-info-item {
  min-width: 0;
  padding: 13px 14px;
  border-radius: 16px;
  background: #fbfaf7;
  border: 1px solid #efe9df;
}

.jas-info-label {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: #9d9285;
}

.jas-info-value {
  margin: 0;
  color: #1c1917;
  font-size: 13px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.jas-mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.jas-empty-value {
  color: #c0b6aa;
  font-style: italic;
}

.jas-sections {
  display: grid;
  gap: 14px;
}

.jas-profile-section {
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fffdf8, #fbfaf7);
  border: 1px solid #efe9df;
}

.jas-section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.jas-member-number {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding: 18px;
  border-radius: 20px;
  background: var(--member-bg);
  border: 1px solid var(--member-border);
}

.jas-member-no {
  margin: 6px 0 0;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(22px, 4vw, 30px);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${G};
}

.jas-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.jas-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.jas-action:hover {
  transform: translateY(-1px);
}

.jas-action-primary {
  background: ${G};
  color: white;
  box-shadow: 0 12px 24px rgba(12,43,28,0.18);
}

.jas-action-secondary {
  background: white;
  color: ${G};
  border: 1px solid rgba(12,43,28,0.18);
}

.jas-action-gold {
  background: ${GOLD};
  color: ${G};
  box-shadow: 0 12px 24px rgba(196,145,44,0.20);
}

.jas-side {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 18px;
}

.jas-side-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(12,43,28,0.09);
  box-shadow: 0 16px 46px rgba(12,43,28,0.075);
}

.jas-progress-list {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
}

.jas-progress-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 12px;
}

.jas-progress-track {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jas-progress-dot {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--dot-bg);
  box-shadow: var(--dot-shadow);
}

.jas-progress-line {
  width: 2px;
  flex: 1;
  min-height: 28px;
  margin: 4px 0;
  border-radius: 999px;
  background: var(--line-bg);
}

.jas-progress-copy {
  padding-bottom: 22px;
}

.jas-progress-item:last-child .jas-progress-copy {
  padding-bottom: 0;
}

.jas-progress-label {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: var(--step-color);
  line-height: 1.3;
}

.jas-progress-sub {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--step-sub-color);
}

.jas-status-card {
  padding: 18px;
  border-radius: 22px;
  background: var(--status-bg);
  border: 1px solid var(--status-border);
  box-shadow: 0 16px 38px var(--status-shadow);
}

.jas-status-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.jas-status-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--status-title);
}

.jas-status-text {
  margin: 0;
  color: var(--status-text);
  font-size: 12px;
  line-height: 1.65;
}

.jas-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  background: var(--badge-bg);
  border: 1px solid var(--badge-border);
  color: var(--badge-color);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.jas-empty-state {
  position: relative;
  overflow: hidden;
  padding: 70px 32px;
  text-align: center;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,250,241,0.94)),
    white;
  border: 1px solid rgba(12,43,28,0.09);
  box-shadow: 0 22px 60px rgba(12,43,28,0.10);
}

.jas-empty-icon {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  margin: 0 auto 22px;
  border-radius: 24px;
  background: ${GOLD_LT};
  border: 1px solid rgba(196,145,44,0.24);
  color: ${GOLD};
}

.jas-empty-state h2 {
  margin: 0 0 10px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 34px;
  line-height: 1;
  color: ${G};
}

.jas-empty-state p {
  max-width: 440px;
  margin: 0 auto 28px;
  color: #71695f;
  font-size: 14px;
  line-height: 1.75;
}

@media (max-width: 920px) {
  .jas-layout {
    grid-template-columns: 1fr;
  }

  .jas-side {
    position: static;
  }
}

@media (max-width: 680px) {
  .jas-container {
    width: min(100% - 28px, 1160px);
  }

  .jas-nav {
    align-items: flex-start;
    padding: 18px 0;
  }

  .jas-brand-title {
    font-size: 24px;
  }

  .jas-logout span {
    display: none;
  }

  .jas-hero {
    padding: 22px;
    border-radius: 24px;
  }

  .jas-hero-inner,
  .jas-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .jas-profile-intro {
    grid-template-columns: 1fr;
  }

  .jas-avatar-wrap {
    width: 96px;
    height: 96px;
  }

  .jas-avatar,
  .jas-avatar-fallback {
    width: 96px;
    height: 96px;
    border-radius: 24px;
  }

  .jas-card-body,
  .jas-card-header {
    padding: 18px;
  }

  .jas-action {
    width: 100%;
  }
}
`

// ── Page ─────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const ID = 'jas-gfonts'
    if (!document.getElementById(ID)) {
      const el = document.createElement('link')
      el.id = ID
      el.rel = 'stylesheet'
      el.href =
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Raleway:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
      document.head.appendChild(el)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')
    setPhotoSignedUrl(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await navigate({ to: '/login', replace: true })
      return
    }

    const { data: rawData, error: memberError } = await supabase
      .from('members')
      .select(
        [
          'id',
          'user_id',
          'member_no',
          'full_name',
          'father_name',
          'cnic',
          'mobile',
          'district',
          'taluka',
          'profession',
          'caste_branch',
          'photo_url',
          'status',
          'rejection_reason',
          'approved_at',
          'created_at',
          'updated_at',
          'address',
          'date_of_birth',
          'gender',
          'education',
          'blood_group',
          'emergency_contact_name',
          'emergency_contact_relation',
          'emergency_contact_mobile',
          'declaration_accepted',
        ].join(', '),
      )
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    const data = rawData as unknown as Member | null
    setMember(data)

    if (data?.photo_url) {
      const { data: signed, error: signedUrlError } = await supabase.storage
        .from('member-photos')
        .createSignedUrl(data.photo_url, 60 * 60)

      if (!signedUrlError) setPhotoSignedUrl(signed?.signedUrl ?? null)
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    await navigate({ to: '/login', replace: true })
  }

  if (loading) {
    return (
      <main className="jas-loading">
        <style>{DASHBOARD_CSS}</style>
        <div className="jas-loading-card">
          <div className="jas-spinner" />
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Loading dashboard…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="jas-dashboard">
      <style>{DASHBOARD_CSS}</style>

      <header className="jas-topbar">
        <div className="jas-container jas-nav">
          <div className="jas-brand">
            <div className="jas-brand-mark">
              <ShieldCheck size={21} color={GOLD} strokeWidth={2.2} />
            </div>
            <div>
              <p className="jas-brand-title">Jatt Alliance Sindh</p>
              <p className="jas-brand-subtitle">Member Portal</p>
            </div>
          </div>

          <button type="button" className="jas-logout" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="jas-container jas-content">
        {error ? (
          <div className="jas-error">
            <AlertCircle size={17} style={{ flex: '0 0 auto', marginTop: 1 }} />
            <span>{error}</span>
          </div>
        ) : null}

        {!member ? (
          <EmptyState />
        ) : (
          <>
            <section className="jas-hero">
              <div className="jas-hero-inner">
                <div className="jas-hero-copy">
                  <p className="jas-eyebrow">Dashboard overview</p>
                  <h1>{member.full_name}</h1>
                  <p className="jas-hero-text">
                    Track your membership application, review your submitted profile, and access your
                    digital card once approved.
                  </p>

                  <div className="jas-hero-meta">
                    <span className="jas-chip">
                      <IdCard size={14} />
                      {member.member_no || 'Member no. pending'}
                    </span>
                    <span className="jas-chip">
                      <Clock size={14} />
                      Submitted {formatDate(member.created_at)}
                    </span>
                    <span className="jas-chip">
                      <ShieldCheck size={14} />
                      {member.district}
                      {member.taluka ? ` / ${member.taluka}` : ''}
                    </span>
                  </div>
                </div>

                <StatusBadge status={member.status} />
              </div>
            </section>

            <div className="jas-layout">
              <section className="jas-card">
                <div className="jas-card-header">
                  <div>
                    <Label text="Membership profile" color={GOLD} />
                    <p className="jas-card-title">Personal information</p>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                <div className="jas-card-body">
                  <div className="jas-profile-intro">
                    <div className="jas-avatar-wrap">
                      {photoSignedUrl ? (
                        <img className="jas-avatar" src={photoSignedUrl} alt={member.full_name} />
                      ) : (
                        <div className="jas-avatar-fallback">
                          <User size={42} color="#C4BAAD" />
                        </div>
                      )}

                      {member.status === 'approved' ? (
                        <span className="jas-verified-dot">
                          <Check size={13} color="white" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>

                    <div className="jas-info-grid">
                      <InfoItem label="Full name" value={member.full_name} />
                      <InfoItem label="Father name" value={member.father_name} />
                      <InfoItem label="CNIC" value={member.cnic} mono />
                      <InfoItem label="Mobile" value={member.mobile} mono />
                      <InfoItem label="District" value={member.district} />
                      <InfoItem label="Taluka" value={member.taluka} />
                      <InfoItem label="Profession" value={member.profession} />
                      <InfoItem label="Caste branch" value={member.caste_branch} />
                    </div>
                  </div>

                  <div className="jas-sections">
                    <ProfileSection title="Additional details">
                      <InfoItem label="Date of birth" value={formatNullableDate(member.date_of_birth)} />
                      <InfoItem label="Gender" value={member.gender} />
                      <InfoItem label="Education" value={member.education} />
                      <InfoItem label="Blood group" value={member.blood_group} />
                    </ProfileSection>

                    <ProfileSection title="Residential address">
                      <div style={{ gridColumn: '1 / -1' }}>
                        <InfoItem label="Complete address" value={member.address} />
                      </div>
                    </ProfileSection>

                    <ProfileSection title="Emergency contact">
                      <InfoItem label="Contact name" value={member.emergency_contact_name} />
                      <InfoItem label="Relation" value={member.emergency_contact_relation} />
                      <InfoItem label="Mobile" value={member.emergency_contact_mobile} mono />
                      <InfoItem
                        label="Declaration"
                        value={member.declaration_accepted ? 'Accepted' : 'Not accepted'}
                      />
                    </ProfileSection>
                  </div>

                  <MemberNumberCard member={member} />

                  <div className="jas-actions">
                    {member.status === 'pending' ? (
                      <ActionLink to="/register" variant="secondary" icon={<Pencil size={15} />}>
                        Edit pending form
                      </ActionLink>
                    ) : null}

                    {member.status === 'approved' ? (
                      <ActionLink to="/card" variant="primary" icon={<CreditCard size={16} />}>
                        View digital card
                      </ActionLink>
                    ) : null}

                    {member.status === 'rejected' ? (
                      <ActionLink to="/register" variant="gold" icon={<RefreshCw size={16} />}>
                        Resubmit application
                      </ActionLink>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="jas-side">
                <ProgressTracker member={member} />
                <StatusMessage member={member} />
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <section className="jas-empty-state">
      <div className="jas-empty-icon">
        <FileText size={34} />
      </div>

      <h2>Complete your membership</h2>
      <p>
        Your account is ready. Submit your membership form to become an official Jatt Alliance Sindh
        member.
      </p>

      <ActionLink to="/register" variant="primary" icon={<Pencil size={15} />}>
        Fill membership form
      </ActionLink>
    </section>
  )
}

function Label({ text, color }: { text: string; color: string }) {
  return (
    <p className="jas-eyebrow" style={{ color }}>
      {text}
    </p>
  )
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="jas-profile-section">
      <Label text={title} color={GOLD} />
      <div className="jas-section-grid">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div className="jas-info-item">
      <p className="jas-info-label">{label}</p>
      <p className={`jas-info-value ${mono ? 'jas-mono' : ''}`}>
        {value || <span className="jas-empty-value">Not provided</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: Member['status'] }) {
  const config = {
    pending: {
      Icon: Clock,
      text: 'Pending',
      bg: '#FFFBEB',
      color: '#92400E',
      border: '#FDE68A',
    },
    approved: {
      Icon: BadgeCheck,
      text: 'Approved',
      bg: '#ECFDF5',
      color: '#065F46',
      border: '#A7F3D0',
    },
    rejected: {
      Icon: XCircle,
      text: 'Rejected',
      bg: '#FEF2F2',
      color: '#991B1B',
      border: '#FECACA',
    },
  }

  const { Icon, text, bg, color, border } = config[status]

  return (
    <span
      className="jas-badge"
      style={
        {
          '--badge-bg': bg,
          '--badge-color': color,
          '--badge-border': border,
        } as CSSProperties
      }
    >
      <Icon size={14} />
      {text}
    </span>
  )
}

function StatusMessage({ member }: { member: Member }) {
  const config = {
    pending: {
      Icon: Hourglass,
      title: 'Under review',
      text: 'Your application is being reviewed. Your digital card will be issued once an admin approves it.',
      bg: '#FFFBEB',
      border: '#FDE68A',
      shadow: 'rgba(146,64,14,0.08)',
      titleColor: '#92400E',
      textColor: '#B45309',
      iconColor: '#D97706',
    },
    approved: {
      Icon: CheckCircle2,
      title: 'Verified member',
      text: member.approved_at
        ? `Approved on ${formatDate(member.approved_at)}`
        : 'Your membership has been approved.',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      shadow: 'rgba(5,150,105,0.08)',
      titleColor: '#065F46',
      textColor: '#047857',
      iconColor: '#059669',
    },
    rejected: {
      Icon: XCircle,
      title: 'Application rejected',
      text:
        member.rejection_reason ||
        'No reason was provided. Please update and resubmit your application.',
      bg: '#FEF2F2',
      border: '#FECACA',
      shadow: 'rgba(185,28,28,0.08)',
      titleColor: '#991B1B',
      textColor: '#B91C1C',
      iconColor: '#DC2626',
    },
  }

  const item = config[member.status]
  const Icon = item.Icon

  return (
    <div
      className="jas-status-card"
      style={
        {
          '--status-bg': item.bg,
          '--status-border': item.border,
          '--status-shadow': item.shadow,
          '--status-title': item.titleColor,
          '--status-text': item.textColor,
        } as CSSProperties
      }
    >
      <div className="jas-status-head">
        <Icon size={17} color={item.iconColor} />
        <p className="jas-status-title">{item.title}</p>
      </div>
      <p className="jas-status-text">{item.text}</p>
    </div>
  )
}

function ProgressTracker({ member }: { member: Member }) {
  const activeIndex = getActiveStep(member)

  return (
    <div className="jas-side-card">
      <Label text="Application progress" color={GOLD} />

      <ol className="jas-progress-list">
        {STATUS_STEPS.map((step, index) => {
          const isDone = index < activeIndex
          const isActive = index === activeIndex
          const isLast = index === STATUS_STEPS.length - 1

          return (
            <li key={step.key} className="jas-progress-item">
              <div className="jas-progress-track">
                <div
                  className="jas-progress-dot"
                  style={
                    {
                      '--dot-bg': isDone ? G : isActive ? GOLD : '#EDE8E0',
                      '--dot-shadow': isActive
                        ? `0 0 0 4px ${GOLD_LT}, 0 0 0 7px rgba(196,145,44,0.26)`
                        : 'none',
                    } as CSSProperties
                  }
                >
                  {isDone ? <Check size={12} color="white" strokeWidth={3} /> : null}
                </div>

                {!isLast ? (
                  <div
                    className="jas-progress-line"
                    style={
                      {
                        '--line-bg': isDone ? G : '#E8E2D8',
                      } as CSSProperties
                    }
                  />
                ) : null}
              </div>

              <div
                className="jas-progress-copy"
                style={
                  {
                    '--step-color': isActive || isDone ? G : '#A89E92',
                    '--step-sub-color': isActive ? GOLD : '#A89E92',
                  } as CSSProperties
                }
              >
                <p className="jas-progress-label">{step.label}</p>
                <p className="jas-progress-sub">{step.sub(member)}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function MemberNumberCard({ member }: { member: Member }) {
  const hasMemberNo = Boolean(member.member_no)

  return (
    <div
      className="jas-member-number"
      style={
        {
          '--member-bg': hasMemberNo
            ? 'linear-gradient(135deg, #FBF0D9, #FFF9EC)'
            : 'linear-gradient(135deg, #F9F7F4, #FFFFFF)',
          '--member-border': hasMemberNo ? '#E2C06A' : '#E8E2D8',
        } as CSSProperties
      }
    >
      <div>
        <Label text="Member no." color={hasMemberNo ? '#92700C' : '#A89E92'} />
        {member.member_no ? (
          <p className="jas-member-no">{member.member_no}</p>
        ) : (
          <p className="jas-info-value jas-mono" style={{ marginTop: 6, color: '#A89E92' }}>
            Not issued yet
          </p>
        )}
      </div>

      <IdCard size={34} color={hasMemberNo ? GOLD : '#C8C0B4'} />
    </div>
  )
}

function ActionLink({
  to,
  variant,
  icon,
  children,
}: {
  to: '/register' | '/card'
  variant: 'primary' | 'secondary' | 'gold'
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Link to={to} className={`jas-action jas-action-${variant}`}>
      {icon}
      {children}
    </Link>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatNullableDate(value: string | null | undefined) {
  if (!value) return null
  return formatDate(value)
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}