// src/routes/dashboard.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  IdCard,
  LogOut,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

const TOKENS = {
  green900: '#0B2A1D',
  green800: '#123726',
  green700: '#1D4B34',
  green100: '#EAF4EE',
  gold700: '#B88427',
  gold600: '#C4912C',
  gold100: '#FBF2DF',
  cream: '#F6F3EC',
  creamDeep: '#EEE7DA',
  text: '#1E1B18',
  textSoft: '#6E675F',
  textMuted: '#9E958B',
  white: '#FFFFFF',
  border: 'rgba(11,42,29,0.10)',
  borderSoft: '#ECE4D8',
  shadow: '0 20px 55px rgba(11,42,29,0.09)',
  shadowStrong: '0 24px 70px rgba(11,42,29,0.14)',
  radiusLg: '30px',
  radiusMd: '22px',
  radiusSm: '16px',
}

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
      if (m.status === 'approved') {
        return m.approved_at ? `Approved ${formatDate(m.approved_at)}` : 'Approved'
      }
      if (m.status === 'rejected') return 'Not approved'
      return 'Awaiting approval'
    },
  },
  {
    key: 'card',
    label: 'Digital card ready',
    sub: (m) => {
      if (m.status === 'approved' && m.member_no) return 'Ready to open'
      if (m.status === 'rejected') return 'Unavailable'
      return 'After approval'
    },
  },
]

function getActiveStep(member: Member) {
  if (member.status === 'pending' || member.status === 'rejected') return 1
  if (member.status === 'approved') return member.member_no ? 3 : 2
  return 0
}

const DASHBOARD_CSS = `
@keyframes jas-spin {
  to { transform: rotate(360deg); }
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.jas-dashboard {
  min-height: 100vh;
  color: ${TOKENS.text};
  font-family: 'Inter', 'Raleway', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at top left, rgba(196,145,44,0.18), transparent 26rem),
    radial-gradient(circle at right top, rgba(11,42,29,0.12), transparent 28rem),
    linear-gradient(180deg, #faf8f3 0%, ${TOKENS.cream} 55%, #f7f4ee 100%);
}

.jas-dashboard,
.jas-dashboard a,
.jas-dashboard button {
  -webkit-tap-highlight-color: transparent;
}

.jas-container {
  width: min(1220px, calc(100% - 40px));
  margin: 0 auto;
}

.jas-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(11,42,29,0.88), rgba(18,55,38,0.84));
  border-bottom: 1px solid rgba(255,255,255,0.10);
}

.jas-nav {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.jas-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.jas-brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  flex: 0 0 auto;
}

.jas-brand-copy {
  min-width: 0;
}

.jas-brand-title {
  margin: 0;
  color: white;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 29px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.jas-brand-subtitle {
  margin: 6px 0 0;
  color: rgba(255,255,255,0.60);
  font-size: 11px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.jas-logout {
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: white;
  min-height: 42px;
  border-radius: 999px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.jas-logout:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.14);
  border-color: rgba(255,255,255,0.28);
}

.jas-content {
  padding: 28px 0 54px;
}

.jas-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: ${TOKENS.cream};
  font-family: 'Inter', system-ui, sans-serif;
}

.jas-loading-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-radius: 20px;
  background: rgba(255,255,255,0.86);
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadow};
  color: ${TOKENS.green800};
}

.jas-spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid ${TOKENS.gold600};
  border-top-color: transparent;
  animation: jas-spin 0.75s linear infinite;
}

.jas-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  box-shadow: 0 12px 30px rgba(159,18,57,0.08);
  font-size: 13px;
  line-height: 1.55;
}

.jas-grid {
  display: grid;
  gap: 20px;
}

.jas-hero {
  position: relative;
  overflow: hidden;
  border-radius: ${TOKENS.radiusLg};
  background:
    linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,250,241,0.95)),
    white;
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadowStrong};
}

.jas-hero::before {
  content: '';
  position: absolute;
  right: -7rem;
  top: -8rem;
  width: 24rem;
  height: 24rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(196,145,44,0.20), transparent 62%);
  pointer-events: none;
}

.jas-hero::after {
  content: '';
  position: absolute;
  left: -5rem;
  bottom: -7rem;
  width: 18rem;
  height: 18rem;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(11,42,29,0.10), transparent 68%);
  pointer-events: none;
}

.jas-hero-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 360px);
  gap: 18px;
  padding: 28px;
}

.jas-eyebrow {
  margin: 0;
  font-size: 11px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${TOKENS.gold600};
}

.jas-hero-title {
  margin: 10px 0 10px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(36px, 6vw, 52px);
  line-height: 0.94;
  letter-spacing: -0.02em;
  color: ${TOKENS.green900};
}

.jas-hero-text {
  max-width: 700px;
  margin: 0;
  color: ${TOKENS.textSoft};
  font-size: 14px;
  line-height: 1.75;
}

.jas-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.jas-chip {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(11,42,29,0.06);
  border: 1px solid rgba(11,42,29,0.08);
  color: ${TOKENS.green900};
  font-size: 12px;
  font-weight: 700;
}

.jas-hero-panel {
  padding: 18px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(11,42,29,0.98), rgba(18,55,38,0.96)),
    ${TOKENS.green900};
  color: white;
  box-shadow: 0 20px 45px rgba(11,42,29,0.22);
  display: grid;
  gap: 14px;
  align-content: start;
}

.jas-hero-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.jas-avatar-wrap {
  position: relative;
  width: 84px;
  height: 84px;
  flex: 0 0 auto;
}

.jas-avatar,
.jas-avatar-fallback {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  border: 3px solid rgba(255,255,255,0.95);
  box-shadow: 0 12px 30px rgba(0,0,0,0.18);
}

.jas-avatar {
  object-fit: cover;
}

.jas-avatar-fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f1ece3, #fff9ef);
}

.jas-verified-dot {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #10b981;
  border: 3px solid white;
}

.jas-hero-name {
  margin: 0;
  color: white;
  font-size: 17px;
  line-height: 1.3;
  font-weight: 800;
}

.jas-hero-sub {
  margin: 5px 0 0;
  color: rgba(255,255,255,0.72);
  font-size: 12px;
  line-height: 1.5;
}

.jas-hero-panel-grid {
  display: grid;
  gap: 10px;
}

.jas-mini-card {
  padding: 12px 13px;
  border-radius: 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.10);
}

.jas-mini-label {
  margin: 0 0 4px;
  color: rgba(255,255,255,0.56);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

.jas-mini-value {
  margin: 0;
  color: white;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
}

.jas-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.jas-stat-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,0.92);
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadow};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.jas-stat-card:hover,
.jas-info-item:hover,
.jas-profile-section:hover,
.jas-side-card:hover,
.jas-help-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 55px rgba(11,42,29,0.11);
  border-color: rgba(11,42,29,0.16);
}

.jas-stat-copy {
  min-width: 0;
}

.jas-stat-label {
  margin: 0 0 6px;
  color: ${TOKENS.textMuted};
  font-size: 11px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.jas-stat-value {
  margin: 0;
  color: ${TOKENS.green900};
  font-size: 15px;
  line-height: 1.45;
  font-weight: 800;
}

.jas-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.jas-card,
.jas-side-card,
.jas-help-card {
  border-radius: 28px;
  background: rgba(255,255,255,0.94);
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadow};
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.jas-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(251,248,242,0.92));
  border-bottom: 1px solid ${TOKENS.borderSoft};
}

.jas-card-title {
  margin: 6px 0 0;
  color: ${TOKENS.green900};
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
}

.jas-card-subtitle {
  margin: 8px 0 0;
  color: ${TOKENS.textSoft};
  font-size: 13px;
  line-height: 1.6;
}

.jas-card-body {
  padding: 24px;
}

.jas-profile-grid {
  display: grid;
  gap: 16px;
}

.jas-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}

.jas-info-item {
  min-width: 0;
  padding: 14px 15px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf9, #faf7f1);
  border: 1px solid ${TOKENS.borderSoft};
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.jas-info-label {
  margin: 0 0 6px;
  color: ${TOKENS.textMuted};
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.jas-info-value {
  margin: 0;
  color: ${TOKENS.text};
  font-size: 13px;
  line-height: 1.52;
  overflow-wrap: anywhere;
}

.jas-empty-value {
  color: #b9b0a4;
  font-style: italic;
}

.jas-mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.jas-section-stack {
  display: grid;
  gap: 14px;
}

.jas-profile-section {
  padding: 18px;
  border-radius: 22px;
  background: linear-gradient(180deg, #fffdf9, #faf7f1);
  border: 1px solid ${TOKENS.borderSoft};
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.jas-section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(176px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.jas-member-number {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-radius: 22px;
  background: var(--member-bg);
  border: 1px solid var(--member-border);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
}

.jas-member-no {
  margin: 7px 0 0;
  color: ${TOKENS.green900};
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(22px, 4vw, 30px);
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.jas-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.jas-action {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 18px;
  border-radius: 15px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}

.jas-action:hover {
  transform: translateY(-1px);
}

.jas-action-primary {
  background: ${TOKENS.green900};
  color: white;
  box-shadow: 0 14px 28px rgba(11,42,29,0.20);
}

.jas-action-secondary {
  background: white;
  color: ${TOKENS.green900};
  border: 1px solid rgba(11,42,29,0.16);
}

.jas-action-gold {
  background: ${TOKENS.gold600};
  color: ${TOKENS.green900};
  box-shadow: 0 14px 28px rgba(196,145,44,0.20);
}

.jas-side {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 14px;
}

.jas-progress-list {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
}

.jas-progress-item {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
}

.jas-progress-track {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jas-progress-dot {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--dot-bg);
  box-shadow: var(--dot-shadow);
}

.jas-progress-line {
  width: 2px;
  flex: 1;
  min-height: 30px;
  margin: 5px 0;
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
  color: var(--step-color);
  font-size: 13px;
  line-height: 1.35;
  font-weight: 800;
}

.jas-progress-sub {
  margin: 4px 0 0;
  color: var(--step-sub-color);
  font-size: 12px;
  line-height: 1.55;
  font-weight: 600;
}

.jas-status-card {
  padding: 18px;
  border-radius: 22px;
  background: var(--status-bg);
  border: 1px solid var(--status-border);
  box-shadow: 0 16px 36px var(--status-shadow);
}

.jas-status-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.jas-status-title {
  margin: 0;
  color: var(--status-title);
  font-size: 14px;
  line-height: 1.3;
  font-weight: 800;
}

.jas-status-text {
  margin: 0;
  color: var(--status-text);
  font-size: 12px;
  line-height: 1.7;
}

.jas-badge {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  border-radius: 999px;
  background: var(--badge-bg);
  border: 1px solid var(--badge-border);
  color: var(--badge-color);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.jas-help-card {
  padding: 18px;
}

.jas-help-text {
  margin: 10px 0 0;
  color: ${TOKENS.textSoft};
  font-size: 13px;
  line-height: 1.7;
}

.jas-help-link {
  margin-top: 14px;
}

.jas-empty-state {
  position: relative;
  overflow: hidden;
  padding: 72px 32px;
  text-align: center;
  border-radius: ${TOKENS.radiusLg};
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,241,0.95));
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadowStrong};
}

.jas-empty-icon {
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  margin: 0 auto 22px;
  border-radius: 24px;
  background: ${TOKENS.gold100};
  border: 1px solid rgba(196,145,44,0.24);
  color: ${TOKENS.gold600};
}

.jas-empty-title {
  margin: 0 0 10px;
  color: ${TOKENS.green900};
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 36px;
  line-height: 1;
  font-weight: 700;
}

.jas-empty-text {
  max-width: 460px;
  margin: 0 auto 28px;
  color: ${TOKENS.textSoft};
  font-size: 14px;
  line-height: 1.75;
}

@media (max-width: 1080px) {
  .jas-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .jas-layout {
    grid-template-columns: 1fr;
  }

  .jas-side {
    position: static;
  }
}

@media (max-width: 860px) {
  .jas-hero-inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .jas-container {
    width: min(100% - 24px, 1220px);
  }

  .jas-nav {
    min-height: 74px;
    padding: 10px 0;
  }

  .jas-brand-title {
    font-size: 24px;
  }

  .jas-logout span {
    display: none;
  }

  .jas-content {
    padding-top: 18px;
  }

  .jas-hero-inner,
  .jas-card-body,
  .jas-card-header {
    padding: 18px;
  }

  .jas-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .jas-stat-grid {
    grid-template-columns: 1fr;
  }

  .jas-actions {
    flex-direction: column;
  }

  .jas-action {
    width: 100%;
  }

  .jas-member-number {
    flex-direction: column;
    align-items: flex-start;
  }

  .jas-empty-state {
    padding: 54px 20px;
  }
}
`

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = 'jas-gfonts'
    if (!document.getElementById(id)) {
      const el = document.createElement('link')
      el.id = id
      el.rel = 'stylesheet'
      el.href =
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
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

    const data = rawData as Member | null
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

  const statItems = useMemo(() => {
    if (!member) return []

    return [
      {
        label: 'Application status',
        value: getStatusText(member.status),
        icon: <ShieldCheck size={18} color={TOKENS.green700} />,
      },
      {
        label: 'Member number',
        value: member.member_no || 'Pending issue',
        icon: <IdCard size={18} color={TOKENS.gold700} />,
      },
      {
        label: 'District',
        value: member.taluka ? `${member.district} / ${member.taluka}` : member.district,
        icon: <MapPin size={18} color={TOKENS.green700} />,
      },
      {
        label: 'Submitted',
        value: formatDate(member.created_at),
        icon: <Clock size={18} color={TOKENS.gold700} />,
      },
    ]
  }, [member])

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
              <ShieldCheck size={21} color={TOKENS.gold600} strokeWidth={2.2} />
            </div>

            <div className="jas-brand-copy">
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
          <div className="jas-grid">
            <section className="jas-hero">
              <div className="jas-hero-inner">
                <div>
                  <p className="jas-eyebrow">Dashboard overview</p>
                  <h1 className="jas-hero-title">Welcome back, {member.full_name}</h1>
                  <p className="jas-hero-text">
                    Track your membership application, review your submitted profile, and access your
                    digital member card as soon as your application is approved.
                  </p>

                  <div className="jas-meta-row">
                    <span className="jas-chip">
                      <Users size={14} />
                      {member.member_no || 'Member no. pending'}
                    </span>
                    <span className="jas-chip">
                      <Clock size={14} />
                      Submitted {formatDate(member.created_at)}
                    </span>
                    <span className="jas-chip">
                      <MapPin size={14} />
                      {member.district}
                      {member.taluka ? ` / ${member.taluka}` : ''}
                    </span>
                  </div>
                </div>

                <div className="jas-hero-panel">
                  <div className="jas-hero-profile">
                    <div className="jas-avatar-wrap">
                      {photoSignedUrl ? (
                        <img className="jas-avatar" src={photoSignedUrl} alt={member.full_name} />
                      ) : (
                        <div className="jas-avatar-fallback">
                          <User size={34} color="#C4BAAD" />
                        </div>
                      )}

                      {member.status === 'approved' ? (
                        <span className="jas-verified-dot">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="jas-hero-name">{member.full_name}</p>
                      <p className="jas-hero-sub">{member.profession || 'Member profile created'}</p>
                    </div>
                  </div>

                  <StatusBadge status={member.status} />

                  <div className="jas-hero-panel-grid">
                    <div className="jas-mini-card">
                      <p className="jas-mini-label">Member number</p>
                      <p className="jas-mini-value">{member.member_no || 'Not issued yet'}</p>
                    </div>

                    <div className="jas-mini-card">
                      <p className="jas-mini-label">Application state</p>
                      <p className="jas-mini-value">{getStatusDescription(member)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="jas-stat-grid">
              {statItems.map((item) => (
                <article key={item.label} className="jas-stat-card">
                  <div className="jas-stat-copy">
                    <p className="jas-stat-label">{item.label}</p>
                    <p className="jas-stat-value">{item.value}</p>
                  </div>
                  {item.icon}
                </article>
              ))}
            </section>

            <div className="jas-layout">
              <section className="jas-card">
                <div className="jas-card-header">
                  <div>
                    <Label text="Membership profile" color={TOKENS.gold600} />
                    <p className="jas-card-title">Personal information</p>
                    <p className="jas-card-subtitle">
                      Review your submitted details below. Update the form if your application is still
                      pending or needs resubmission.
                    </p>
                  </div>
                  <StatusBadge status={member.status} />
                </div>

                <div className="jas-card-body">
                  <div className="jas-profile-grid">
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

                    <div className="jas-section-stack">
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
                </div>
              </section>

              <aside className="jas-side">
                <div className="jas-side-card" style={{ padding: '20px' }}>
                  <Label text="Application progress" color={TOKENS.gold600} />
                  <ol className="jas-progress-list">
                    <ProgressTracker member={member} />
                  </ol>
                </div>

                <StatusMessage member={member} />

                <div className="jas-help-card">
                  <Label text="Quick access" color={TOKENS.gold600} />
                  <p className="jas-help-text">
                    {member.status === 'approved'
                      ? 'Your profile is approved. Open your digital card to verify your membership details.'
                      : member.status === 'rejected'
                        ? 'Your application needs updates before it can be reconsidered. Please review the rejection message and resubmit.'
                        : 'Your application is in review. You can still edit submitted details while the form remains pending.'}
                  </p>

                  <div className="jas-help-link">
                    {member.status === 'approved' ? (
                      <ActionLink to="/card" variant="primary" icon={<ArrowRight size={15} />}>
                        Open member card
                      </ActionLink>
                    ) : (
                      <ActionLink to="/register" variant="secondary" icon={<ArrowRight size={15} />}>
                        Open application
                      </ActionLink>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <section className="jas-empty-state">
      <div className="jas-empty-icon">
        <FileText size={34} />
      </div>

      <h2 className="jas-empty-title">Complete your membership</h2>
      <p className="jas-empty-text">
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
      <Label text={title} color={TOKENS.gold600} />
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
      text: 'Your application is currently being reviewed by the admin team. Your digital card will be issued after approval.',
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
        ? `Approved on ${formatDate(member.approved_at)}. Your profile is active and your membership record is verified.`
        : 'Your membership has been approved and verified.',
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
        'No reason was provided. Please update your information and submit the application again.',
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
    <>
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
                    '--dot-bg': isDone ? TOKENS.green900 : isActive ? TOKENS.gold600 : '#EDE8E0',
                    '--dot-shadow': isActive
                      ? `0 0 0 4px ${TOKENS.gold100}, 0 0 0 7px rgba(196,145,44,0.24)`
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
                      '--line-bg': isDone ? TOKENS.green900 : '#E8E2D8',
                    } as CSSProperties
                  }
                />
              ) : null}
            </div>

            <div
              className="jas-progress-copy"
              style={
                {
                  '--step-color': isActive || isDone ? TOKENS.green900 : '#A89E92',
                  '--step-sub-color': isActive ? TOKENS.gold700 : '#A89E92',
                } as CSSProperties
              }
            >
              <p className="jas-progress-label">{step.label}</p>
              <p className="jas-progress-sub">{step.sub(member)}</p>
            </div>
          </li>
        )
      })}
    </>
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
          '--member-border': hasMemberNo ? '#E2C06A' : TOKENS.creamDeep,
        } as CSSProperties
      }
    >
      <div>
        <Label text="Member no." color={hasMemberNo ? '#92700C' : '#A89E92'} />
        {member.member_no ? (
          <p className="jas-member-no">{member.member_no}</p>
        ) : (
          <p className="jas-info-value jas-mono" style={{ marginTop: 7, color: '#A89E92' }}>
            Not issued yet
          </p>
        )}
      </div>

      <IdCard size={36} color={hasMemberNo ? TOKENS.gold600 : '#C8C0B4'} />
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

function getStatusText(status: Member['status']) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending review'
  }
}

function getStatusDescription(member: Member) {
  switch (member.status) {
    case 'approved':
      return member.member_no ? 'Card available' : 'Approval complete'
    case 'rejected':
      return 'Needs resubmission'
    default:
      return 'Awaiting admin review'
  }
}

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