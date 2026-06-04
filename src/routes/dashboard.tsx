// src/routes/dashboard.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BadgeIndianRupee,
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FileHeart,
  HandHeart,
  HeartPulse,
  IdCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { formatDonationMoney, getDonationPurposeLabel } from '../lib/donations'
import {
  MEMBERSHIP_BASE_FEE,
  MEMBERSHIP_PAYMENT_COMING_SOON_TEXT,
  type MembershipPayment,
  formatMembershipMoney,
  getMembershipFeeSubtext,
  getMembershipPaymentDisplayStatus,
  getMembershipPaymentStatusClass,
  getMembershipPaymentStatusLabel,
} from '../lib/membership-fee'
import {
  getNotificationTone,
  getProgramApplyPath,
  getProgramLabel,
  getProgramPath,
  getProgramSingularLabel,
  getProgramStatusClass,
  getProgramStatusLabel,
  type UserNotification,
} from '../lib/notifications'
import { supabase } from '../lib/supabase/client'
import {
  formatDisplayDate as formatDate,
  maskCnic,
  maskMobile,
} from '../lib/shared/formatters'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

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

type ProgramApplication = {
  id: string
  application_no: string | null
  program_key: string
  status: string
  applicant_name: string
  membership_no: string
  district: string | null
  taluka: string | null
  approved_amount: number | null
  admin_remarks: string | null
  created_at: string
  submitted_at: string
  updated_at: string
}

type FinanceDonation = {
  id: string
  donation_no: string | null
  amount: number
  purpose: string
  status: string
  approved_at: string | null
  created_at: string
}

type LeaderboardRow = {
  donor_member_id: string
  total_donated: number
  donation_count: number
}

type DashboardData = {
  member: Member | null
  photoSignedUrl: string | null
  applications: ProgramApplication[]
  donations: FinanceDonation[]
  donorRank: number | null
  notifications: UserNotification[]
  membershipPayment: MembershipPayment | null
}

const programOrder = ['education', 'health', 'welfare', 'employment']

function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [, setRefreshing] = useState(false)
  const [showSensitive, setShowSensitive] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<DashboardData>({
    member: null,
    photoSignedUrl: null,
    applications: [],
    donations: [],
    donorRank: null,
    notifications: [],
    membershipPayment: null,
  })

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      await navigate({ to: '/login', replace: true })
      return
    }

    const { data: memberData, error: memberError } = await supabase
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
      .returns<Member | null>()

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      setRefreshing(false)
      return
    }

    const [applications, donations, notifications, membershipPayment, photoSignedUrl, donorRank] =
      await Promise.all([
        loadProgramApplications(user.id),
        loadDonations(user.id),
        loadNotifications(user.id),
        loadMembershipPayment(memberData?.id),
        loadMemberPhoto(memberData?.photo_url),
        loadDonorRank(memberData?.id),
      ])

    setData({
      member: memberData,
      photoSignedUrl,
      applications,
      donations,
      donorRank,
      notifications,
      membershipPayment,
    })

    setLoading(false)
    setRefreshing(false)
  }

  const member = data.member
  const membershipPaymentStatus = getMembershipPaymentDisplayStatus(
    data.membershipPayment,
  )

  const summaries = useMemo(() => {
    const byProgram = programOrder.map((programKey) => {
      const items = data.applications.filter(
        (item) => item.program_key === programKey,
      )
      const latest = [...items].sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime(),
      )[0]

      return {
        programKey,
        total: items.length,
        latest,
      }
    })

    const approvedDonations = data.donations.filter(
      (item) => item.status === 'approved',
    )
    const totalDonated = approvedDonations.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    )
    const pendingDonations = data.donations.filter(
      (item) => item.status === 'pending',
    ).length

    return {
      byProgram,
      totalDonated,
      donationCount: approvedDonations.length,
      pendingDonations,
      unreadNotifications: data.notifications.filter((item) => !item.is_read)
        .length,
    }
  }, [data.applications, data.donations, data.notifications])

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="page-wrap rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
            Loading member dashboard...
          </div>
        </div>
      </main>
    )
  }

  if (!member) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="page-wrap rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <ShieldCheck className="h-10 w-10 text-amber-700" />
          <h1 className="mt-4 text-3xl font-black text-slate-950">
            Membership application required
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
            Dashboard details tab show honge jab aap membership form submit kar
            denge. Pehle registration complete karen.
          </p>
          <div className="mt-5 max-w-2xl rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm leading-6 text-amber-900">
            <p className="font-black">
              Membership Application Fee: {formatMembershipMoney(MEMBERSHIP_BASE_FEE)} + applicable tax/processing charges.
            </p>
            <p className="mt-1 text-amber-800">{getMembershipFeeSubtext()}</p>
          </div>
          <Link to="/register" className="primary-btn mt-6">
            Submit Membership Form
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 md:py-10">
      <div className="page-wrap space-y-8">
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200">
                  <LayoutIcon />
                  Unified Member Dashboard
                </div>

                <h1 className="mt-5 text-3xl font-black md:text-5xl">
                  Welcome, {member.full_name}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                  Membership, programs, donations, donor rank aur latest updates
                  ek hi dashboard par track karen.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <InfoChip icon={<IdCard className="h-4 w-4" />}>
                    {member.member_no || 'Member ID pending'}
                  </InfoChip>
                  <InfoChip icon={<MapPin className="h-4 w-4" />}>
                    {member.taluka
                      ? `${member.district} / ${member.taluka}`
                      : member.district}
                  </InfoChip>
                  <InfoChip icon={<CalendarDays className="h-4 w-4" />}>
                    Joined {formatDate(member.created_at)}
                  </InfoChip>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-4">
                  {data.photoSignedUrl ? (
                    <img
                      src={data.photoSignedUrl}
                      alt={member.full_name}
                      className="h-20 w-20 rounded-3xl border-2 border-amber-300 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-amber-300 bg-white/10">
                      <User className="h-8 w-8 text-white/60" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xl font-black">
                      {member.full_name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/65">
                      Father: {member.father_name}
                    </p>
                    <StatusBadge status={member.status} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniMetric label="Notifications" value={summaries.unreadNotifications} />
                  <MiniMetric
                    label="Donor Rank"
                    value={data.donorRank ? `#${data.donorRank}` : '-'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:p-6">
            <OverviewCard
              label="Membership"
              value={getMemberStatusLabel(member.status)}
              icon={<ShieldCheck className="h-5 w-5" />}
              tone="emerald"
            />
            <OverviewCard
              label="Fee Status"
              value={getMembershipPaymentStatusLabel(membershipPaymentStatus)}
              icon={<CreditCard className="h-5 w-5" />}
              tone="amber"
            />
            <OverviewCard
              label="Programs Submitted"
              value={data.applications.length}
              icon={<BookOpenCheck className="h-5 w-5" />}
              tone="amber"
            />
            <OverviewCard
              label="Total Donated"
              value={formatDonationMoney(summaries.totalDonated)}
              icon={<BadgeIndianRupee className="h-5 w-5" />}
              tone="emerald"
            />
            <OverviewCard
              label="Pending Donations"
              value={summaries.pendingDonations}
              icon={<Trophy className="h-5 w-5" />}
              tone="slate"
            />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    My Activity
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Program summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Education, Health, Welfare aur Employment statuses.
                  </p>
                </div>
                <Link to="/notifications" className="secondary-btn">
                  <Bell className="h-4 w-4" />
                  View Updates
                </Link>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {summaries.byProgram.map((item) => (
                  <ProgramSummaryCard key={item.programKey} item={item} />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Member Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Personal information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    CNIC/mobile masked by default hain.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSensitive((value) => !value)}
                  className="secondary-btn"
                >
                  {showSensitive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showSensitive ? 'Hide' : 'Show'} Sensitive
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoBox label="Full name" value={member.full_name} />
                <InfoBox label="Father name" value={member.father_name} />
                <InfoBox
                  label="CNIC"
                  value={showSensitive ? member.cnic : maskCnic(member.cnic)}
                />
                <InfoBox
                  label="Mobile"
                  value={showSensitive ? member.mobile : maskMobile(member.mobile)}
                />
                <InfoBox label="District" value={member.district} />
                <InfoBox label="Taluka" value={member.taluka || 'Not provided'} />
                <InfoBox
                  label="Profession"
                  value={member.profession || 'Not provided'}
                />
                <InfoBox
                  label="Education"
                  value={member.education || 'Not provided'}
                />
                <InfoBox
                  label="Blood Group"
                  value={member.blood_group || 'Not provided'}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <QuickActions member={member} />
            <MembershipFeePanel payment={data.membershipPayment} />
            <DonationPanel
              totalDonated={summaries.totalDonated}
              donationCount={summaries.donationCount}
              donorRank={data.donorRank}
              latestDonation={data.donations[0]}
            />
            <NotificationsPreview notifications={data.notifications} />
          </aside>
        </section>
      </div>
    </main>
  )
}

function LayoutIcon() {
  return <Users className="h-4 w-4" />
}

function InfoChip({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85">
      {icon}
      {children}
    </span>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}

function OverviewCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string | number
  icon: ReactNode
  tone: 'emerald' | 'amber' | 'slate'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-slate-50 text-slate-800'

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}
      >
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </article>
  )
}

function ProgramSummaryCard({
  item,
}: {
  item: { programKey: string; total: number; latest?: ProgramApplication }
}) {
  const Icon = getProgramIcon(item.programKey)
  const latest = item.latest

  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-950">
              {getProgramLabel(item.programKey)}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {item.total} submitted record{item.total === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {latest ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${getProgramStatusClass(
              latest.status,
            )}`}
          >
            {getProgramStatusLabel(latest.status)}
          </span>
        ) : null}
      </div>

      {latest ? (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="font-black text-slate-950">
            {latest.application_no || getProgramSingularLabel(item.programKey)}
          </p>
          <p className="mt-1 text-slate-500">
            Updated {formatDate(latest.updated_at || latest.created_at)}
          </p>
          {latest.approved_amount ? (
            <p className="mt-1 font-bold text-emerald-800">
              Approved amount: {formatDonationMoney(latest.approved_amount)}
            </p>
          ) : null}
          <a
            href={`${getProgramPath(item.programKey)}/${latest.id}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800 no-underline"
          >
            Open details
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm">
          <p className="text-slate-600">No application submitted yet.</p>
          <a
            href={getProgramApplyPath(item.programKey)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800 no-underline"
          >
            Apply now
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </article>
  )
}


function MembershipFeePanel({ payment }: { payment: MembershipPayment | null }) {
  const status = getMembershipPaymentDisplayStatus(payment)

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Membership Fee
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            {formatMembershipMoney(payment?.total_amount ?? MEMBERSHIP_BASE_FEE)}
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${getMembershipPaymentStatusClass(
            status,
          )}`}
        >
          {getMembershipPaymentStatusLabel(status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <InfoBox
          label="Base Fee"
          value={formatMembershipMoney(payment?.base_amount ?? MEMBERSHIP_BASE_FEE)}
        />
        <InfoBox
          label="Tax/Charges"
          value={payment ? formatMembershipMoney(payment.tax_amount) : 'Applicable at payment step'}
        />
        <InfoBox
          label="Payment"
          value={payment?.gateway_reference || MEMBERSHIP_PAYMENT_COMING_SOON_TEXT}
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-amber-800">
        Final payable amount will be shown before payment. Membership fee is separate from voluntary donations.
      </p>
    </section>
  )
}

function QuickActions({ member }: { member: Member }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        Quick Actions
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Next steps</h2>
      <div className="mt-5 grid gap-3">
        {member.status === 'approved' ? (
          <>
            <Link to="/card" className="primary-btn w-full">
              <CreditCard className="h-4 w-4" />
              Open Digital Card
            </Link>

            <Link
              to="/designation-card"
              className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-[var(--r-lg)] bg-slate-950 px-5 py-3 text-sm font-black !text-white no-underline shadow-sm transition hover:bg-emerald-950 hover:!text-white"
              style={{ color: '#ffffff' }}
            >
              <BadgeCheck className="h-4 w-4" />
              Office Bearer Card
            </Link>
          </>
        ) : (
          <Link to="/register" className="primary-btn w-full">
            <IdCard className="h-4 w-4" />
            Open Membership Form
          </Link>
        )}
        <Link to="/donate" className="secondary-btn w-full">
          <BadgeIndianRupee className="h-4 w-4" />
          Submit Donation
        </Link>
        <Link to="/donors" className="secondary-btn w-full">
          <Trophy className="h-4 w-4" />
          View Donors
        </Link>
      </div>
    </section>
  )
}

function DonationPanel({
  totalDonated,
  donationCount,
  donorRank,
  latestDonation,
}: {
  totalDonated: number
  donationCount: number
  donorRank: number | null
  latestDonation?: FinanceDonation
}) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        My Donations
      </p>
      <p className="mt-2 text-3xl font-black text-slate-950">
        {formatDonationMoney(totalDonated)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-400">
            Approved
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {donationCount}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[0.68rem] font-black uppercase tracking-wide text-slate-400">
            Rank
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {donorRank ? `#${donorRank}` : '-'}
          </p>
        </div>
      </div>
      {latestDonation ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Latest: {latestDonation.donation_no || 'Donation'} ·{' '}
          {getDonationPurposeLabel(latestDonation.purpose)} ·{' '}
          {getProgramStatusLabel(latestDonation.status)}
        </p>
      ) : (
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Approved donation ke baad leaderboard rank yahan show hoga.
        </p>
      )}
    </section>
  )
}

function NotificationsPreview({
  notifications,
}: {
  notifications: UserNotification[]
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Recent Updates
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Notifications
          </h2>
        </div>
        <Link to="/notifications" className="text-sm font-black text-emerald-800">
          View all
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {notifications.slice(0, 4).map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-3 ${getNotificationTone(
              item.category,
            )}`}
          >
            <p className="text-sm font-black">{item.title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
              {item.message}
            </p>
          </article>
        ))}
        {!notifications.length ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            Abhi koi notification nahi hai. Status change hone par updates yahan
            show honge.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const config = {
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-red-200 bg-red-50 text-red-800',
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
  } satisfies Record<MemberStatus, string>

  return (
    <span
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black ${config[status]}`}
    >
      {status === 'approved' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === 'rejected' ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : (
        <BadgeCheck className="h-3.5 w-3.5" />
      )}
      {getMemberStatusLabel(status)}
    </span>
  )
}

async function loadProgramApplications(userId: string) {
  const { data, error } = await supabase
    .from('program_applications')
    .select(
      'id, application_no, program_key, status, applicant_name, membership_no, district, taluka, approved_amount, admin_remarks, created_at, submitted_at, updated_at',
    )
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: false })
    .returns<ProgramApplication[]>()

  if (error) return []
  return data || []
}

async function loadDonations(userId: string) {
  const { data, error } = await supabase
    .from('finance_donations')
    .select('id, donation_no, amount, purpose, status, approved_at, created_at')
    .eq('donor_user_id', userId)
    .order('created_at', { ascending: false })
    .returns<FinanceDonation[]>()

  if (error) return []
  return data || []
}

async function loadNotifications(userId: string) {
  const client = supabase as unknown as {
    from: (table: 'notifications') => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => {
            limit: (count: number) => Promise<{
              data: UserNotification[] | null
              error: Error | null
            }>
          }
        }
      }
    }
  }

  const { data, error } = await client
    .from('notifications')
    .select(
      'id, user_id, title, message, category, related_type, related_id, action_url, is_read, read_at, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) return []
  return data || []
}


async function loadMembershipPayment(memberId?: string | null) {
  if (!memberId) return null

  const { data, error } = await supabase
    .from('membership_payments')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle()
    .returns<MembershipPayment | null>()

  if (error) {
    console.warn('Membership payment status could not be loaded:', error.message)
    return null
  }

  return data
}

async function loadMemberPhoto(photoUrl?: string | null) {
  if (!photoUrl) return null

  const { data, error } = await supabase.storage
    .from('member-photos')
    .createSignedUrl(photoUrl, 60 * 60)

  if (error) return null
  return data?.signedUrl ?? null
}

async function loadDonorRank(memberId?: string | null) {
  if (!memberId) return null

  const client = supabase as unknown as {
    rpc: (
      fn: 'get_donor_leaderboard',
      args: { _limit: number },
    ) => Promise<{ data: LeaderboardRow[] | null; error: Error | null }>
  }

  const { data, error } = await client.rpc('get_donor_leaderboard', {
    _limit: 100,
  })

  if (error || !data) return null
  const index = data.findIndex((row) => row.donor_member_id === memberId)
  return index >= 0 ? index + 1 : null
}

function getProgramIcon(programKey: string) {
  switch (programKey) {
    case 'education':
      return BookOpenCheck
    case 'health':
      return HeartPulse
    case 'welfare':
      return HandHeart
    case 'employment':
      return BriefcaseBusiness
    default:
      return FileHeart
  }
}

function getMemberStatusLabel(status: MemberStatus) {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending Review'
  }
}

