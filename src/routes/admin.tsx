import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

type Member = {
  id: string
  full_name: string
  cnic: string
  mobile: string
  district: string
  photo_url: string
  status: 'pending' | 'approved' | 'rejected'
  member_no: string | null
  created_at: string
}

function AdminPage() {
  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isMemberDetailPage = pathname.startsWith('/admin/members/')

  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isMemberDetailPage) {
      loadAdmin()
    }
  }, [isMemberDetailPage])

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesStatus =
        statusFilter === 'all' || member.status === statusFilter

      const query = search.trim().toLowerCase()

      const matchesSearch =
        !query ||
        member.full_name.toLowerCase().includes(query) ||
        member.cnic.toLowerCase().includes(query) ||
        member.mobile.toLowerCase().includes(query) ||
        member.district.toLowerCase().includes(query) ||
        (member.member_no ?? '').toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [members, search, statusFilter])

  if (isMemberDetailPage) {
    return <Outlet />
  }

  async function loadAdmin() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate({ to: '/login' })
      return
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!role) {
      navigate({ to: '/dashboard' })
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select(
        'id, full_name, cnic, mobile, district, photo_url, status, member_no, created_at',
      )
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMembers(data ?? [])

    const signedMap: Record<string, string> = {}

    await Promise.all(
      (data ?? []).map(async (member) => {
        if (!member.photo_url) return

        const { data: signed } = await supabase.storage
          .from('member-photos')
          .createSignedUrl(member.photo_url, 60 * 60)

        if (signed?.signedUrl) {
          signedMap[member.id] = signed.signedUrl
        }
      }),
    )

    setPhotoUrls(signedMap)
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="px-4 py-10">
        <div className="page-wrap rounded-2xl bg-white p-6 shadow-sm">
          Loading admin panel...
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-10">
      <div className="page-wrap space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Jatt Alliance Sindh
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review membership applications and manage member approval.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input md:max-w-md"
              placeholder="Search name, CNIC, mobile, district, member no..."
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input md:max-w-xs"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3">Photo</th>
                  <th className="py-3">Name</th>
                  <th className="py-3">CNIC</th>
                  <th className="py-3">District</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Member No</th>
                  <th className="py-3">Submitted</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-3">
                      {photoUrls[member.id] ? (
                        <img
                          src={photoUrls[member.id]}
                          alt={member.full_name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-slate-100" />
                      )}
                    </td>

                    <td className="py-3 font-medium text-slate-900">
                      {member.full_name}
                    </td>

                    <td className="py-3 text-slate-700">{member.cnic}</td>
                    <td className="py-3 text-slate-700">{member.district}</td>

                    <td className="py-3">
                      <StatusBadge status={member.status} />
                    </td>

                    <td className="py-3 text-slate-700">
                      {member.member_no ?? '—'}
                    </td>

                    <td className="py-3 text-slate-700">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3">
                      <Link
                        to="/admin/members/$id"
                        params={{ id: member.id }}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white no-underline hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No members found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

function StatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected'
}) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-red-200',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  )
}