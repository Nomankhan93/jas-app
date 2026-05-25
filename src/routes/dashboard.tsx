// src/routes/dashboard.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Hourglass,
  IdCard,
  LockKeyhole,
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
  green950: '#071F15',
  green900: '#0B2A1D',
  green800: '#123726',
  green700: '#1D4B34',
  green100: '#EAF4EE',
  gold700: '#9B6E18',
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
  shadow: '0 18px 46px rgba(11,42,29,0.08)',
  shadowStrong: '0 22px 60px rgba(11,42,29,0.12)',
}

type MemberStatus = 'pending' | 'approved' | 'rejected'

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
  status: MemberStatus
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
    sub: (member) => formatDate(member.created_at),
  },
  {
    key: 'review',
    label: 'Admin review',
    sub: (member) => {
      if (member.status === 'approved') return 'Completed'
      if (member.status === 'rejected') return 'Action required'
      return 'In progress'
    },
  },
  {
    key: 'approval',
    label: 'Approval & ID issue',
    sub: (member) => {
      if (member.status === 'approved') {
        return member.approved_at
          ? `Approved ${formatDate(member.approved_at)}`
          : 'Approved'
      }

      if (member.status === 'rejected') return 'Not approved'
      return 'Awaiting approval'
    },
  },
  {
    key: 'card',
    label: 'Digital card ready',
    sub: (member) => {
      if (member.status === 'approved' && member.member_no) return 'Ready to open'
      if (member.status === 'rejected') return 'Unavailable'
      return 'After approval'
    },
  },
]

function DashboardPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [member, setMember] = useState<Member | null>(null)
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showSensitive, setShowSensitive] = useState(false)

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

  async function loadDashboard(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false

    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

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
      setRefreshing(false)
      return
    }

    const data = rawData as Member | null
    setMember(data)

    if (data?.photo_url) {
      const { data: signed, error: signedUrlError } = await supabase.storage
        .from('member-photos')
        .createSignedUrl(data.photo_url, 60 * 60)

      if (!signedUrlError) {
        setPhotoSignedUrl(signed?.signedUrl ?? null)
      }
    }

    setLoading(false)
    setRefreshing(false)
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
        label: 'District / Taluka',
        value: member.taluka
          ? `${member.district} / ${member.taluka}`
          : member.district,
        icon: <MapPin size={18} color={TOKENS.green700} />,
      },
      {
        label: 'Last updated',
        value: formatDate(member.updated_at || member.created_at),
        icon: <CalendarDays size={18} color={TOKENS.gold700} />,
      },
    ]
  }, [member])

  if (loading) {
    return (
      <main className="jas-dashboard-page">
        <style>{DASHBOARD_CSS}</style>

        <section className="jas-loading">
          <div className="jas-loading-card">
            <div className="jas-spinner" />
            <p>Loading dashboard…</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="jas-dashboard-page">
      <style>{DASHBOARD_CSS}</style>

      <div className="jas-container jas-content">
        {error ? (
          <div className="jas-error" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        ) : null}

        {!member ? (
          <EmptyState onRefresh={() => loadDashboard({ silent: true })} />
        ) : (
          <div className="jas-grid">
            <section className="jas-hero">
              <div className="jas-hero-inner">
                <div>
                  <p className="jas-eyebrow">Dashboard overview</p>

                  <h1 className="jas-hero-title">
                    Welcome back, {member.full_name}
                  </h1>

                  <p className="jas-hero-text">{getHeroText(member)}</p>

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
                        <img
                          className="jas-avatar"
                          src={photoSignedUrl}
                          alt={`${member.full_name} profile photo`}
                        />
                      ) : (
                        <div className="jas-avatar-fallback" aria-hidden="true">
                          <User size={34} color="#C4BAAD" />
                        </div>
                      )}

                      {member.status === 'approved' ? (
                        <span className="jas-verified-dot" title="Approved member">
                          <Check size={12} color="white" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="jas-hero-name">{member.full_name}</p>
                      <p className="jas-hero-sub">
                        {member.profession || 'Member profile created'}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={member.status} />

                  <div className="jas-hero-panel-grid">
                    <div className="jas-mini-card">
                      <p className="jas-mini-label">Member number</p>
                      <p className="jas-mini-value">
                        {member.member_no || 'Not issued yet'}
                      </p>
                    </div>

                    <div className="jas-mini-card">
                      <p className="jas-mini-label">Application state</p>
                      <p className="jas-mini-value">
                        {getStatusDescription(member)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <StatusNotice member={member} />

            <section className="jas-stat-grid" aria-label="Membership summary">
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
                    <Label text="Membership profile" color={TOKENS.gold700} />

                    <p className="jas-card-title">Personal information</p>

                    <p className="jas-card-subtitle">
                      Review your submitted details below. Sensitive information
                      is masked by default for privacy.
                    </p>
                  </div>

                  <div className="jas-header-actions">
                    <button
                      type="button"
                      onClick={() => setShowSensitive((value) => !value)}
                      className="jas-icon-action"
                      aria-pressed={showSensitive}
                    >
                      {showSensitive ? <EyeOff size={15} /> : <Eye size={15} />}
                      {showSensitive ? 'Hide sensitive' : 'Show sensitive'}
                    </button>

                    <button
                      type="button"
                      onClick={() => loadDashboard({ silent: true })}
                      disabled={refreshing}
                      className="jas-icon-action"
                    >
                      <RefreshCw
                        size={15}
                        className={refreshing ? 'jas-spin-icon' : ''}
                      />
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="jas-card-body">
                  <div className="jas-profile-grid">
                    <div className="jas-info-grid">
                      <InfoItem label="Full name" value={member.full_name} />
                      <InfoItem label="Father name" value={member.father_name} />

                      <InfoItem
                        label="CNIC"
                        value={
                          showSensitive ? member.cnic : maskCnic(member.cnic)
                        }
                        mono
                        sensitive={!showSensitive}
                      />

                      <InfoItem
                        label="Mobile"
                        value={
                          showSensitive ? member.mobile : maskMobile(member.mobile)
                        }
                        mono
                        sensitive={!showSensitive}
                      />

                      <InfoItem label="District" value={member.district} />
                      <InfoItem label="Taluka" value={member.taluka} />
                      <InfoItem label="Profession" value={member.profession} />
                      <InfoItem label="Caste branch" value={member.caste_branch} />
                    </div>

                    <div className="jas-section-stack">
                      <ProfileSection title="Additional details">
                        <InfoItem
                          label="Date of birth"
                          value={formatNullableDate(member.date_of_birth)}
                        />
                        <InfoItem label="Gender" value={member.gender} />
                        <InfoItem label="Education" value={member.education} />
                        <InfoItem label="Blood group" value={member.blood_group} />
                      </ProfileSection>

                      <ProfileSection title="Residential address">
                        <div className="jas-full-row">
                          <InfoItem
                            label="Complete address"
                            value={member.address}
                          />
                        </div>
                      </ProfileSection>

                      <ProfileSection title="Emergency contact">
                        <InfoItem
                          label="Contact name"
                          value={member.emergency_contact_name}
                        />
                        <InfoItem
                          label="Relation"
                          value={member.emergency_contact_relation}
                        />
                        <InfoItem
                          label="Mobile"
                          value={
                            member.emergency_contact_mobile
                              ? showSensitive
                                ? member.emergency_contact_mobile
                                : maskMobile(member.emergency_contact_mobile)
                              : null
                          }
                          mono
                          sensitive={
                            Boolean(member.emergency_contact_mobile) &&
                            !showSensitive
                          }
                        />
                        <InfoItem
                          label="Declaration"
                          value={
                            member.declaration_accepted
                              ? 'Accepted'
                              : 'Not accepted'
                          }
                        />
                      </ProfileSection>
                    </div>

                    <MemberNumberCard member={member} />

                    <div className="jas-actions">
                      {member.status === 'pending' ? (
                        <ActionLink
                          to="/register"
                          variant="secondary"
                          icon={<Pencil size={15} />}
                        >
                          Edit pending form
                        </ActionLink>
                      ) : null}

                      {member.status === 'approved' ? (
                        <ActionLink
                          to="/card"
                          variant="primary"
                          icon={<CreditCard size={16} />}
                        >
                          View digital card
                        </ActionLink>
                      ) : null}

                      {member.status === 'rejected' ? (
                        <ActionLink
                          to="/register"
                          variant="gold"
                          icon={<RefreshCw size={16} />}
                        >
                          Update & resubmit
                        </ActionLink>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <aside className="jas-side">
                <div className="jas-side-card">
                  <Label text="Application progress" color={TOKENS.gold700} />

                  <ol className="jas-progress-list">
                    <ProgressTracker member={member} />
                  </ol>
                </div>

                <StatusMessage member={member} />

                <div className="jas-help-card">
                  <Label text="Quick access" color={TOKENS.gold700} />

                  <p className="jas-help-text">{getQuickAccessText(member)}</p>

                  <div className="jas-help-link">
                    {member.status === 'approved' ? (
                      <ActionLink
                        to="/card"
                        variant="primary"
                        icon={<ArrowRight size={15} />}
                      >
                        Open member card
                      </ActionLink>
                    ) : (
                      <ActionLink
                        to="/register"
                        variant="secondary"
                        icon={<ArrowRight size={15} />}
                      >
                        Open application
                      </ActionLink>
                    )}
                  </div>
                </div>

                <div className="jas-privacy-card">
                  <div className="jas-privacy-icon">
                    <LockKeyhole size={17} />
                  </div>

                  <div>
                    <p className="jas-privacy-title">Privacy protected</p>
                    <p className="jas-privacy-text">
                      CNIC and mobile numbers are masked on this dashboard until
                      you choose to reveal them.
                    </p>
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

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="jas-empty-state">
      <div className="jas-empty-content">
        <div className="jas-empty-icon">
          <FileText size={34} />
        </div>

        <h2 className="jas-empty-title">Complete your membership</h2>

        <p className="jas-empty-text">
          Your account is ready. Submit your membership form to become an
          official Jatt Alliance Sindh member.
        </p>

        <div className="jas-empty-actions">
          <ActionLink to="/register" variant="primary" icon={<Pencil size={15} />}>
            Fill membership form
          </ActionLink>

          <button type="button" onClick={onRefresh} className="jas-action jas-action-secondary">
            <RefreshCw size={15} />
            Refresh status
          </button>
        </div>
      </div>
    </section>
  )
}

function StatusNotice({ member }: { member: Member }) {
  const config = {
    pending: {
      Icon: Hourglass,
      title: 'Your application is under review',
      text: 'You can still edit your submitted form while the application is pending. Once approved, your digital card will be available.',
      className: 'jas-notice--pending',
    },
    approved: {
      Icon: CheckCircle2,
      title: 'Your membership is approved',
      text: member.member_no
        ? `Your member number is ${member.member_no}. You can now open your digital membership card.`
        : 'Your application is approved. Member number issuance may still be in progress.',
      className: 'jas-notice--approved',
    },
    rejected: {
      Icon: XCircle,
      title: 'Your application needs correction',
      text:
        member.rejection_reason ||
        'Please review your submitted information and resubmit your application.',
      className: 'jas-notice--rejected',
    },
  }

  const item = config[member.status]
  const Icon = item.Icon

  return (
    <section className={`jas-notice ${item.className}`}>
      <div className="jas-notice-icon">
        <Icon size={18} />
      </div>

      <div>
        <h2>{item.title}</h2>
        <p>{item.text}</p>
      </div>
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

function ProfileSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="jas-profile-section">
      <Label text={title} color={TOKENS.gold700} />
      <div className="jas-section-grid">{children}</div>
    </section>
  )
}

function InfoItem({
  label,
  value,
  mono = false,
  sensitive = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  sensitive?: boolean
}) {
  return (
    <div className="jas-info-item">
      <p className="jas-info-label">
        {label}
        {sensitive ? <LockKeyhole size={11} aria-label="Masked" /> : null}
      </p>

      <p className={`jas-info-value ${mono ? 'jas-mono' : ''}`}>
        {value || <span className="jas-empty-value">Not provided</span>}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const config = {
    pending: {
      Icon: Clock,
      text: 'Pending review',
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
      text: 'Your application is currently being reviewed by the admin team. You will be able to access your digital card after approval.',
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
                    '--dot-bg': isDone
                      ? TOKENS.green900
                      : isActive
                        ? TOKENS.gold600
                        : '#EDE8E0',
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
                  '--step-color':
                    isActive || isDone ? TOKENS.green900 : '#A89E92',
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
          <p className="jas-info-value jas-mono jas-pending-member-no">
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

function getActiveStep(member: Member) {
  if (member.status === 'pending') return 1
  if (member.status === 'rejected') return 1
  if (member.status === 'approved') return member.member_no ? 3 : 2
  return 0
}

function getHeroText(member: Member) {
  if (member.status === 'approved') {
    return 'Your membership has been approved. You can review your submitted profile and access your verified digital membership card.'
  }

  if (member.status === 'rejected') {
    return 'Your application needs correction before approval. Review the rejection message, update your form, and resubmit it for admin review.'
  }

  return 'Track your membership application, review your submitted profile, and edit your details while the application is pending.'
}

function getQuickAccessText(member: Member) {
  if (member.status === 'approved') {
    return 'Your profile is approved. Open your digital card to verify your membership details and QR code.'
  }

  if (member.status === 'rejected') {
    return 'Your application needs updates before it can be reconsidered. Review the rejection message and resubmit.'
  }

  return 'Your application is in review. You can still edit submitted details while the form remains pending.'
}

function getStatusText(status: MemberStatus) {
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

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function maskCnic(value: string | null | undefined) {
  if (!value) return null

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 13) return '*****-*******-*'

  return `${digits.slice(0, 5)}-*****${digits.slice(10, 12)}-${digits.slice(12)}`
}

function maskMobile(value: string | null | undefined) {
  if (!value) return null

  const clean = value.replace(/[^\d+]/g, '')

  if (clean.startsWith('+92') && clean.length >= 13) {
    return `${clean.slice(0, 6)}*****${clean.slice(-2)}`
  }

  if (clean.startsWith('03') && clean.length >= 11) {
    return `${clean.slice(0, 4)}*****${clean.slice(-2)}`
  }

  return '***********'
}

const DASHBOARD_CSS = `
@keyframes jas-spin {
  to { transform: rotate(360deg); }
}

.jas-dashboard-page,
.jas-dashboard-page *,
.jas-dashboard-page *::before,
.jas-dashboard-page *::after {
  box-sizing: border-box;
}

.jas-dashboard-page {
  position: relative;
  z-index: 1;
  color: ${TOKENS.text};
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.jas-dashboard-page a,
.jas-dashboard-page button {
  -webkit-tap-highlight-color: transparent;
}

.jas-container {
  width: min(1220px, calc(100% - 40px));
  margin: 0 auto;
}

.jas-content {
  padding: 24px 0 54px;
}

.jas-loading {
  min-height: calc(100vh - 104px);
  display: grid;
  place-items: center;
  font-family: 'Inter', system-ui, sans-serif;
}

.jas-loading-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  border-radius: 20px;
  background: rgba(255,255,255,0.88);
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadow};
  color: ${TOKENS.green800};
}

.jas-loading-card p {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}

.jas-spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 2px solid ${TOKENS.gold600};
  border-top-color: transparent;
  animation: jas-spin 0.75s linear infinite;
}

.jas-spin-icon {
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

.jas-error svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.jas-grid {
  display: grid;
  gap: 20px;
}

.jas-hero {
  position: relative;
  overflow: hidden;
  border-radius: 30px;
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
  font-weight: 800;
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
  font-weight: 800;
}

.jas-notice {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid var(--notice-border);
  background: var(--notice-bg);
  box-shadow: 0 16px 34px var(--notice-shadow);
}

.jas-notice h2 {
  margin: 0 0 5px;
  color: var(--notice-title);
  font-size: 15px;
  line-height: 1.25;
  font-weight: 900;
}

.jas-notice p {
  margin: 0;
  color: var(--notice-text);
  font-size: 13px;
  line-height: 1.65;
}

.jas-notice-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--notice-icon-bg);
  color: var(--notice-icon-color);
}

.jas-notice--pending {
  --notice-bg: #FFFBEB;
  --notice-border: #FDE68A;
  --notice-shadow: rgba(146,64,14,0.08);
  --notice-title: #92400E;
  --notice-text: #B45309;
  --notice-icon-bg: #FEF3C7;
  --notice-icon-color: #D97706;
}

.jas-notice--approved {
  --notice-bg: #ECFDF5;
  --notice-border: #A7F3D0;
  --notice-shadow: rgba(5,150,105,0.08);
  --notice-title: #065F46;
  --notice-text: #047857;
  --notice-icon-bg: #D1FAE5;
  --notice-icon-color: #059669;
}

.jas-notice--rejected {
  --notice-bg: #FEF2F2;
  --notice-border: #FECACA;
  --notice-shadow: rgba(185,28,28,0.08);
  --notice-title: #991B1B;
  --notice-text: #B91C1C;
  --notice-icon-bg: #FEE2E2;
  --notice-icon-color: #DC2626;
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
.jas-help-card:hover,
.jas-privacy-card:hover {
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
  font-weight: 900;
}

.jas-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.jas-card,
.jas-side-card,
.jas-help-card,
.jas-privacy-card {
  border-radius: 28px;
  background: rgba(255,255,255,0.94);
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadow};
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.jas-side-card {
  padding: 20px;
}

.jas-card-header {
  display: flex;
  align-items: flex-start;
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

.jas-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.jas-icon-action {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(11,42,29,0.12);
  background: white;
  color: ${TOKENS.green900};
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.jas-icon-action:hover:not(:disabled) {
  transform: translateY(-1px);
  background: ${TOKENS.green100};
  border-color: rgba(11,42,29,0.20);
}

.jas-icon-action:disabled {
  opacity: 0.58;
  cursor: not-allowed;
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
  display: inline-flex;
  align-items: center;
  gap: 5px;
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
  font-weight: 700;
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

.jas-full-row {
  grid-column: 1 / -1;
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
  font-weight: 800;
  letter-spacing: 0.04em;
}

.jas-pending-member-no {
  margin-top: 7px;
  color: #A89E92;
}

.jas-actions,
.jas-empty-actions {
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
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 900;
  border: none;
  cursor: pointer;
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
  color: ${TOKENS.green950};
  box-shadow: 0 14px 28px rgba(196,145,44,0.20);
}

.jas-side {
  position: sticky;
  top: 112px;
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
  font-weight: 900;
}

.jas-progress-sub {
  margin: 4px 0 0;
  color: var(--step-sub-color);
  font-size: 12px;
  line-height: 1.55;
  font-weight: 700;
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
  font-weight: 900;
}

.jas-status-text {
  margin: 0;
  color: var(--status-text);
  font-size: 12px;
  line-height: 1.7;
  font-weight: 600;
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
  font-weight: 900;
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

.jas-privacy-card {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  background: linear-gradient(180deg, #fffdf9, #faf7f1);
}

.jas-privacy-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: ${TOKENS.green100};
  color: ${TOKENS.green900};
}

.jas-privacy-title {
  margin: 0 0 4px;
  color: ${TOKENS.green900};
  font-size: 13px;
  font-weight: 900;
}

.jas-privacy-text {
  margin: 0;
  color: ${TOKENS.textSoft};
  font-size: 12px;
  line-height: 1.6;
}

.jas-empty-state {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 180px);
  display: grid;
  place-items: center;
  padding: 44px 24px;
  text-align: center;
  border-radius: 30px;
  background:
    radial-gradient(circle at top, rgba(196,145,44,0.10), transparent 22rem),
    linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,250,241,0.95));
  border: 1px solid ${TOKENS.border};
  box-shadow: ${TOKENS.shadowStrong};
}

.jas-empty-content {
  width: min(540px, 100%);
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
  font-size: clamp(34px, 5vw, 48px);
  line-height: 1;
  font-weight: 700;
}

.jas-empty-text {
  max-width: 460px;
  margin: 0 auto 28px;
  color: ${TOKENS.textSoft};
  font-size: 15px;
  line-height: 1.75;
}

.jas-empty-actions {
  justify-content: center;
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

  .jas-content {
    padding: 16px 0 36px;
  }

  .jas-hero-inner,
  .jas-card-body,
  .jas-card-header {
    padding: 18px;
  }

  .jas-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .jas-header-actions {
    justify-content: stretch;
  }

  .jas-icon-action {
    width: 100%;
  }

  .jas-stat-grid {
    grid-template-columns: 1fr;
  }

  .jas-notice {
    grid-template-columns: 1fr;
  }

  .jas-actions,
  .jas-empty-actions {
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
    min-height: calc(100vh - 150px);
    padding: 36px 18px;
  }
}
`