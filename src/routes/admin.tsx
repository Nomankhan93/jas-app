// src/routes/admin.tsx
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Eye,
  EyeOff,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { supabase } from '../lib/supabase/client'
import { AdminProgramShortcuts } from '../components/admin/AdminProgramShortcuts'
import {
  AdminMemberManagement,
  AdminMemberStatsGrid,
  type AdminDateFilter as DateFilter,
  type AdminMemberListItem as Member,
  type AdminSortBy as SortBy,
  type AdminStatusFilter as StatusFilter,
} from '../components/admin/AdminMemberManagement'
import {
  csvCell,
  formatDisplayDate as formatDate,
  maskCnic,
  maskMobile,
  uniqueSorted,
} from '../lib/shared/formatters'
import {
  filterRowsByAreaAccess,
  getAreaAccessSummaryText,
  loadCurrentAdminAreaAccess,
} from '../lib/area-permissions'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const adminRoleNames = [
  'admin',
  'super_admin',
  'membership_admin',
  'education_admin',
  'health_admin',
  'employment_admin',
  'ration_admin',
  'welfare_admin',
  'finance_admin',
] as const

type AdminRoleName = (typeof adminRoleNames)[number]
type AdminAccessResult =
  | { ok: true; roles: AdminRoleName[] }
  | { ok: false; redirectTo: '/login' | '/dashboard' }

const MEMBER_PHOTO_BUCKET = 'member-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

const roleLabels: Record<AdminRoleName, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  membership_admin: 'Membership Admin',
  education_admin: 'Education Admin',
  health_admin: 'Health Admin',
  employment_admin: 'Employment Admin',
  ration_admin: 'Ration Admin',
  welfare_admin: 'Welfare Admin',
  finance_admin: 'Finance Admin',
}

function AdminPage() {
  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const normalizedPathname = pathname.replace(/\/+$/, '') || '/'
  const isNestedAdminPage = normalizedPathname !== '/admin'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [adminRoles, setAdminRoles] = useState<AdminRoleName[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [talukaFilter, setTalukaFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [search, setSearch] = useState('')
  const [showSensitive, setShowSensitive] = useState(false)
  const [error, setError] = useState('')
  const [areaNotice, setAreaNotice] = useState('')

  const loadAdmin = useCallback(
    async (
      cancelledRef?: { current: boolean },
      options?: { silent?: boolean },
    ) => {
      const silent = options?.silent ?? false

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')
      setAreaNotice('')

      try {
        const access = await ensureAdminAccess()

        if (!access.ok) {
          if (!cancelledRef?.current) {
            await navigate({ to: access.redirectTo })
          }

          return
        }

        if (!canManageMembersFromRoles(access.roles)) {
          if (!cancelledRef?.current) {
            await navigate({ to: getPrimaryAdminRoute(access.roles) })
          }

          return
        }

        if (!cancelledRef?.current) {
          setAdminRoles(access.roles)
        }

        const areaAccess = await loadCurrentAdminAreaAccess('membership', 'view', {
          requiredRoles: ['admin', 'super_admin', 'membership_admin'],
        })

        if (!areaAccess.ok) {
          throw new Error(areaAccess.message)
        }

        const { data, error: membersError } = await supabase
          .from('members')
          .select(
            [
              'id',
              'full_name',
              'cnic',
              'mobile',
              'district',
              'taluka',
              'photo_url',
              'status',
              'member_no',
              'created_at',
            ].join(', '),
          )
          .order('created_at', { ascending: false })
          .returns<Member[]>()

        if (membersError) throw membersError

        const safeMembers = filterRowsByAreaAccess(data ?? [], areaAccess)
        const signedUrls = await createSignedPhotoUrls(safeMembers)

        if (!cancelledRef?.current) {
          setMembers(safeMembers)
          setPhotoUrls(signedUrls)
          setAreaNotice(getAreaAccessSummaryText(areaAccess))
        }
      } catch (err) {
        if (!cancelledRef?.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to load admin members.',
          )
        }
      } finally {
        if (!cancelledRef?.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (isNestedAdminPage) return

    const cancelledRef = { current: false }

    void loadAdmin(cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [isNestedAdminPage, loadAdmin])

  const stats = useMemo(() => {
    return members.reduce(
      (acc, member) => {
        acc.total += 1
        acc[member.status] += 1

        if (canOpenMemberCard(member)) {
          acc.cards += 1
        }

        return acc
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cards: 0,
      },
    )
  }, [members])

  const districtOptions = useMemo(() => {
    return uniqueSorted(members.map((member) => member.district).filter(Boolean))
  }, [members])

  const talukaOptions = useMemo(() => {
    const source =
      districtFilter === 'all'
        ? members
        : members.filter((member) => member.district === districtFilter)

    return uniqueSorted(
      source.map((member) => member.taluka ?? '').filter(Boolean),
    )
  }, [districtFilter, members])

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = members.filter((member) => {
      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter

      const matchesDistrict =
        districtFilter === 'all' || member.district === districtFilter

      const matchesTaluka =
        talukaFilter === 'all' || member.taluka === talukaFilter

      const matchesDate = matchesDateFilter(member.created_at, dateFilter)

      const matchesSearch =
        query.length === 0 || buildMemberSearchText(member).includes(query)

      return (
        matchesStatus &&
        matchesDistrict &&
        matchesTaluka &&
        matchesDate &&
        matchesSearch
      )
    })

    return sortMembers(result, sortBy)
  }, [
    dateFilter,
    districtFilter,
    members,
    search,
    sortBy,
    statusFilter,
    talukaFilter,
  ])

  const hasActiveFilters =
    statusFilter !== 'all' ||
    districtFilter !== 'all' ||
    talukaFilter !== 'all' ||
    dateFilter !== 'all' ||
    search.trim().length > 0

  function resetFilters() {
    setStatusFilter('all')
    setDistrictFilter('all')
    setTalukaFilter('all')
    setDateFilter('all')
    setSortBy('newest')
    setSearch('')
  }

  function handleDistrictFilter(value: string) {
    setDistrictFilter(value)
    setTalukaFilter('all')
  }

  function exportCsv() {
    if (showSensitive) {
      const confirmed = window.confirm(
        'This export will include full CNIC and mobile numbers. Continue only if this is required for official verification.',
      )

      if (!confirmed) return
    }

    const csv = buildCsv(filteredMembers, showSensitive)
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const privacySuffix = showSensitive ? 'full' : 'masked'

    link.href = url
    link.download = `jas-members-${privacySuffix}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    link.click()

    URL.revokeObjectURL(url)
  }

  if (isNestedAdminPage) {
    return <Outlet />
  }

  if (loading) {
    return (
      <main className="px-3 py-6 sm:px-4 sm:py-10">
        <div className="page-wrap rounded-3xl bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-700" />
            Loading admin control center...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <header className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Jatt Alliance Sindh
                </p>

                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  JAS Admin Control Center
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Manage membership applications and access authorized program
                  modules for education, health, welfare, employment and finance. Sensitive
                  CNIC/mobile data stays masked unless explicitly required.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {adminRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 shadow-sm ring-1 ring-emerald-100"
                    >
                      {roleLabels[role]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                <button
                  type="button"
                  onClick={() => setShowSensitive((value) => !value)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition ${
                    showSensitive
                      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {showSensitive ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showSensitive ? 'Hide Sensitive Data' : 'Show Sensitive Data'}
                </button>

                <button
                  type="button"
                  onClick={() => void loadAdmin(undefined, { silent: true })}
                  disabled={refreshing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {showSensitive ? (
            <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800 sm:px-7">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="m-0">
                Sensitive data is visible. Use this mode only for official
                verification, and avoid exporting or sharing records unless
                approved by JAS leadership.
              </p>
            </div>
          ) : null}

          <AdminMemberStatsGrid
            stats={stats}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </header>

        <AdminProgramShortcuts roles={adminRoles} stats={stats} />


        {areaNotice ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{areaNotice}</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <AdminMemberManagement
          members={members}
          filteredMembers={filteredMembers}
          photoUrls={photoUrls}
          showSensitive={showSensitive}
          hasActiveFilters={hasActiveFilters}
          statusFilter={statusFilter}
          districtFilter={districtFilter}
          districtOptions={districtOptions}
          talukaFilter={talukaFilter}
          talukaOptions={talukaOptions}
          dateFilter={dateFilter}
          sortBy={sortBy}
          search={search}
          onStatusFilterChange={setStatusFilter}
          onDistrictFilterChange={handleDistrictFilter}
          onTalukaFilterChange={setTalukaFilter}
          onDateFilterChange={setDateFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearch}
          onResetFilters={resetFilters}
          onExportCsv={exportCsv}
        />
      </div>
    </main>
  )
}

async function ensureAdminAccess(): Promise<AdminAccessResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, redirectTo: '/login' }
  }

  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', adminRoleNames)

  if (roleError || !roles?.length) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  const safeRoles = roles
    .map((item) => item.role)
    .filter((role): role is AdminRoleName =>
      adminRoleNames.includes(role as AdminRoleName),
    )

  if (!safeRoles.length) {
    return { ok: false, redirectTo: '/dashboard' }
  }

  return { ok: true, roles: safeRoles }
}

function canManageMembersFromRoles(roles: readonly AdminRoleName[]) {
  return roles.some((role) =>
    ['admin', 'super_admin', 'membership_admin'].includes(role),
  )
}

function getPrimaryAdminRoute(
  roles: readonly AdminRoleName[],
):
  | '/admin/programs/education'
  | '/admin/programs/health'
  | '/admin/programs/welfare'
  | '/admin/programs/employment'
  | '/admin/finance'
  | '/admin/cms'
  | '/admin/news'
  | '/admin/reports'
  | '/admin/roles'
  | '/admin/area-permissions'
  | '/admin/audit-logs'
  | '/admin/committees'
  | '/dashboard' {
  if (roles.includes('education_admin')) return '/admin/programs/education'
  if (roles.includes('health_admin')) return '/admin/programs/health'
  if (roles.includes('welfare_admin')) return '/admin/programs/welfare'
  if (roles.includes('employment_admin')) return '/admin/programs/employment'
  if (roles.includes('finance_admin')) return '/admin/finance'
  return '/dashboard'
}

async function createSignedPhotoUrls(
  members: Member[],
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    members.map(async (member) => {
      if (!member.photo_url) return null

      const { data, error } = await supabase.storage
        .from(MEMBER_PHOTO_BUCKET)
        .createSignedUrl(member.photo_url, SIGNED_URL_TTL_SECONDS)

      if (error || !data?.signedUrl) return null

      return [member.id, data.signedUrl] as const
    }),
  )

  return Object.fromEntries(
    entries.filter(Boolean) as Array<readonly [string, string]>,
  )
}

function buildMemberSearchText(member: Member) {
  return [
    member.full_name,
    member.cnic,
    member.mobile,
    member.district,
    member.taluka ?? '',
    member.member_no ?? '',
    member.status,
  ]
    .join(' ')
    .toLowerCase()
}

function canOpenMemberCard(member: Member) {
  return member.status === 'approved' && Boolean(member.member_no)
}

function sortMembers(members: Member[], sortBy: SortBy) {
  const copy = [...members]

  switch (sortBy) {
    case 'oldest':
      return copy.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    case 'name':
      return copy.sort((a, b) => a.full_name.localeCompare(b.full_name))
    case 'district':
      return copy.sort((a, b) => {
        const district = a.district.localeCompare(b.district)
        if (district !== 0) return district
        return a.full_name.localeCompare(b.full_name)
      })
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }
}

function matchesDateFilter(value: string, filter: DateFilter) {
  if (filter === 'all') return true

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()

  if (filter === 'today') {
    return date.toDateString() === now.toDateString()
  }

  const days = filter === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - days)

  return date >= cutoff
}

function buildCsv(members: Member[], includeSensitive: boolean) {
  const rows = [
    [
      'Full Name',
      'CNIC',
      'Mobile',
      'District',
      'Taluka',
      'Status',
      'Member No',
      'Submitted',
      'Export Mode',
    ],
    ...members.map((member) => [
      member.full_name,
      includeSensitive ? member.cnic : maskCnic(member.cnic),
      includeSensitive ? member.mobile : maskMobile(member.mobile),
      member.district,
      member.taluka ?? '',
      member.status,
      member.member_no ?? '',
      formatDate(member.created_at),
      includeSensitive ? 'Full sensitive data' : 'Masked sensitive data',
    ]),
  ]

  return rows.map((row) => row.map(csvCell).join(',')).join('\n')
}

