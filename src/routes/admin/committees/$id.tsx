import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Edit3, Loader2, Save, Search, ShieldAlert, Trash2, UserPlus, Users } from 'lucide-react'
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  addCommitteeMember,
  committeeStatusOptions,
  committeeTypeOptions,
  currentUserCanManageCommittees,
  fetchCommitteeDetails,
  fetchDesignations,
  formatCommitteeDate,
  getCommitteeStatusClass,
  getCommitteeStatusLabel,
  getCommitteeTypeLabel,
  removeCommitteeMember,
  searchApprovedMembers,
  updateCommittee,
  updateCommitteeMember,
  type CommitteeDetails,
  type CommitteeMemberRecord,
  type CommitteeStatus,
  type CommitteeType,
  type DesignationRecord,
  type MemberSearchResult,
} from '../../../lib/committees'

export const Route = createFileRoute('/admin/committees/$id')({
  component: AdminCommitteeDetailPage,
})

type CommitteeForm = {
  committeeType: CommitteeType
  name: string
  district: string
  taluka: string
  tenureStart: string
  tenureEnd: string
  status: CommitteeStatus
  publicDisplay: boolean
  notes: string
}

type MemberForm = {
  designationId: string
  designationTitle: string
  status: CommitteeStatus
  sortOrder: string
  tenureStart: string
  tenureEnd: string
  appointmentNotes: string
}

const inputClass = 'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'

function AdminCommitteeDetailPage() {
  const { id } = Route.useParams()
  const [committee, setCommittee] = useState<CommitteeDetails | null>(null)
  const [designations, setDesignations] = useState<DesignationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memberSaving, setMemberSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<MemberSearchResult[]>([])
  const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [committeeForm, setCommitteeForm] = useState<CommitteeForm>({
    committeeType: 'central',
    name: '',
    district: '',
    taluka: '',
    tenureStart: '',
    tenureEnd: '',
    status: 'active',
    publicDisplay: true,
    notes: '',
  })
  const [memberForm, setMemberForm] = useState<MemberForm>({
    designationId: '',
    designationTitle: '',
    status: 'active',
    sortOrder: '1',
    tenureStart: '',
    tenureEnd: '',
    appointmentNotes: '',
  })

  useEffect(() => {
    void loadDetails()
  }, [id])

  async function loadDetails() {
    setLoading(true)
    setMessage('')

    try {
      const allowed = await currentUserCanManageCommittees()
      if (!allowed) {
        setMessage('Only admin or super admin can manage committees and designations.')
        setCommittee(null)
        return
      }

      const details = await fetchCommitteeDetails(id)
      if (!details) {
        setMessage('Committee not found.')
        setCommittee(null)
        return
      }

      const designationList = await fetchDesignations(details.committee_type)
      setCommittee(details)
      setDesignations(designationList.filter((item) => item.is_active))
      setCommitteeForm({
        committeeType: details.committee_type,
        name: details.name,
        district: details.district ?? '',
        taluka: details.taluka ?? '',
        tenureStart: details.tenure_start ?? '',
        tenureEnd: details.tenure_end ?? '',
        status: details.status,
        publicDisplay: details.public_display,
        notes: details.notes ?? '',
      })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load committee.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCommitteeSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      if (!committeeForm.name.trim()) throw new Error('Committee name is required.')

      await updateCommittee(id, {
        committee_type: committeeForm.committeeType,
        name: committeeForm.name.trim(),
        district: committeeForm.district.trim() || null,
        taluka: committeeForm.taluka.trim() || null,
        tenure_start: committeeForm.tenureStart || null,
        tenure_end: committeeForm.tenureEnd || null,
        status: committeeForm.status,
        public_display: committeeForm.publicDisplay,
        notes: committeeForm.notes.trim() || null,
      })

      setMessage('Committee updated successfully.')
      await loadDetails()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update committee.')
    } finally {
      setSaving(false)
    }
  }

  async function handleMemberSearch() {
    setMessage('')

    try {
      setMemberResults(await searchApprovedMembers(memberSearch))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Member search failed.')
    }
  }

  function handleDesignationChange(value: string) {
    const selectedDesignation = designations.find((item) => item.id === value)

    setMemberForm((current) => ({
      ...current,
      designationId: value,
      designationTitle: selectedDesignation?.title ?? current.designationTitle,
    }))
  }

  function startEditMember(member: CommitteeMemberRecord) {
    setEditingMemberId(member.id)
    setSelectedMember(null)
    setMemberForm({
      designationId: member.designation_id ?? '',
      designationTitle: member.designation_title,
      status: member.status,
      sortOrder: String(member.sort_order),
      tenureStart: member.tenure_start ?? '',
      tenureEnd: member.tenure_end ?? '',
      appointmentNotes: member.appointment_notes ?? '',
    })
  }

  function resetMemberForm() {
    setEditingMemberId(null)
    setSelectedMember(null)
    setMemberSearch('')
    setMemberResults([])
    setMemberForm({
      designationId: '',
      designationTitle: '',
      status: 'active',
      sortOrder: String((committee?.members.length ?? 0) + 1),
      tenureStart: '',
      tenureEnd: '',
      appointmentNotes: '',
    })
  }

  async function handleMemberSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMemberSaving(true)
    setMessage('')

    try {
      if (!memberForm.designationTitle.trim()) throw new Error('Designation title is required.')

      const payload = {
        designation_id: memberForm.designationId || null,
        designation_title: memberForm.designationTitle.trim(),
        status: memberForm.status,
        sort_order: Number(memberForm.sortOrder) || 1,
        tenure_start: memberForm.tenureStart || null,
        tenure_end: memberForm.tenureEnd || null,
        appointment_notes: memberForm.appointmentNotes.trim() || null,
      }

      if (editingMemberId) {
        await updateCommitteeMember(editingMemberId, payload)
        setMessage('Committee member updated successfully.')
      } else {
        if (!selectedMember) throw new Error('Select an approved member first.')

        await addCommitteeMember({
          committee_id: id,
          member: selectedMember,
          ...payload,
        })
        setMessage('Committee member added successfully.')
      }

      resetMemberForm()
      await loadDetails()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save committee member.')
    } finally {
      setMemberSaving(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    const confirmed = window.confirm('Remove this member from the committee record?')
    if (!confirmed) return

    setMessage('')

    try {
      await removeCommitteeMember(memberId)
      setMessage('Committee member removed.')
      await loadDetails()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to remove committee member.')
    }
  }

  const committeeMembers = useMemo(() => committee?.members ?? [], [committee])

  if (loading) {
    return <main className="page-wrap py-10"><StateCard message="Loading committee details..." /></main>
  }

  if (!committee) {
    return (
      <main className="page-wrap py-10">
        <StateCard message={message || 'Committee not found.'} tone="error" />
      </main>
    )
  }

  return (
    <main className="px-3 py-6 sm:px-4 sm:py-10">
      <div className="page-wrap space-y-6">
        <Link to="/admin/committees" className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 no-underline">
          <ArrowLeft size={16} /> Back to Committees
        </Link>

        <header className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{getCommitteeTypeLabel(committee.committee_type)}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{committee.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {committee.district || 'Central'} {committee.taluka ? `· ${committee.taluka}` : ''} · Tenure {formatCommitteeDate(committee.tenure_start)} to {formatCommitteeDate(committee.tenure_end)}
              </p>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-black uppercase ring-1 ${getCommitteeStatusClass(committee.status)}`}>
              {getCommitteeStatusLabel(committee.status)}
            </span>
          </div>
        </header>

        {message ? <StateCard message={message} tone={message.toLowerCase().includes('failed') || message.toLowerCase().includes('required') || message.toLowerCase().includes('only') ? 'error' : 'default'} /> : null}

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <form onSubmit={handleCommitteeSave} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Save size={22} /></span>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Committee Details</h2>
                  <p className="text-sm text-slate-500">Update structure and tenure.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Field label="Committee Type"><select value={committeeForm.committeeType} onChange={(e) => setCommitteeForm((c) => ({ ...c, committeeType: e.target.value as CommitteeType }))} className={inputClass}>{committeeTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                <Field label="Name"><input value={committeeForm.name} onChange={(e) => setCommitteeForm((c) => ({ ...c, name: e.target.value }))} className={inputClass} /></Field>
                <Field label="District"><input value={committeeForm.district} onChange={(e) => setCommitteeForm((c) => ({ ...c, district: e.target.value }))} className={inputClass} /></Field>
                <Field label="Taluka"><input value={committeeForm.taluka} onChange={(e) => setCommitteeForm((c) => ({ ...c, taluka: e.target.value }))} className={inputClass} /></Field>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Tenure Start"><input type="date" value={committeeForm.tenureStart} onChange={(e) => setCommitteeForm((c) => ({ ...c, tenureStart: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Tenure End"><input type="date" value={committeeForm.tenureEnd} onChange={(e) => setCommitteeForm((c) => ({ ...c, tenureEnd: e.target.value }))} className={inputClass} /></Field>
                </div>
                <Field label="Status"><select value={committeeForm.status} onChange={(e) => setCommitteeForm((c) => ({ ...c, status: e.target.value as CommitteeStatus }))} className={inputClass}>{committeeStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700"><input type="checkbox" checked={committeeForm.publicDisplay} onChange={(e) => setCommitteeForm((c) => ({ ...c, publicDisplay: e.target.checked }))} /> Public display later</label>
                <Field label="Notes"><textarea value={committeeForm.notes} onChange={(e) => setCommitteeForm((c) => ({ ...c, notes: e.target.value }))} className={`${inputClass} min-h-[90px] py-3`} /></Field>
                <button type="submit" disabled={saving} className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save Committee'}</button>
              </div>
            </form>

            <form onSubmit={handleMemberSubmit} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-lime-800">{editingMemberId ? <Edit3 size={22} /> : <UserPlus size={22} />}</span>
                <div>
                  <h2 className="text-xl font-black text-slate-950">{editingMemberId ? 'Edit Office Bearer' : 'Add Office Bearer'}</h2>
                  <p className="text-sm text-slate-500">Assign approved members to designations.</p>
                </div>
              </div>

              {!editingMemberId ? (
                <div className="mb-4 space-y-3">
                  <Field label="Search Approved Member">
                    <div className="flex gap-2">
                      <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className={inputClass} placeholder="Name or member no" />
                      <button type="button" onClick={() => void handleMemberSearch()} className="secondary-btn px-4"><Search size={16} /></button>
                    </div>
                  </Field>

                  {memberResults.length ? (
                    <div className="grid gap-2">
                      {memberResults.map((member) => (
                        <button key={member.id} type="button" onClick={() => setSelectedMember(member)} className={`rounded-2xl border p-3 text-left text-sm transition ${selectedMember?.id === member.id ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                          <span className="block font-black text-slate-950">{member.full_name}</span>
                          <span className="block text-xs">{member.member_no ?? 'No member no'} · {member.district ?? 'District N/A'} {member.taluka ? `· ${member.taluka}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-4">
                <Field label="Designation">
                  <select value={memberForm.designationId} onChange={(e) => handleDesignationChange(e.target.value)} className={inputClass}>
                    <option value="">Custom designation</option>
                    {designations.map((designation) => <option key={designation.id} value={designation.id}>{designation.title}</option>)}
                  </select>
                </Field>
                <Field label="Designation Title"><input value={memberForm.designationTitle} onChange={(e) => setMemberForm((c) => ({ ...c, designationTitle: e.target.value }))} className={inputClass} placeholder="General Secretary" /></Field>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Status"><select value={memberForm.status} onChange={(e) => setMemberForm((c) => ({ ...c, status: e.target.value as CommitteeStatus }))} className={inputClass}>{committeeStatusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
                  <Field label="Display Order"><input type="number" min="1" value={memberForm.sortOrder} onChange={(e) => setMemberForm((c) => ({ ...c, sortOrder: e.target.value }))} className={inputClass} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Field label="Tenure Start"><input type="date" value={memberForm.tenureStart} onChange={(e) => setMemberForm((c) => ({ ...c, tenureStart: e.target.value }))} className={inputClass} /></Field>
                  <Field label="Tenure End"><input type="date" value={memberForm.tenureEnd} onChange={(e) => setMemberForm((c) => ({ ...c, tenureEnd: e.target.value }))} className={inputClass} /></Field>
                </div>
                <Field label="Appointment Notes"><textarea value={memberForm.appointmentNotes} onChange={(e) => setMemberForm((c) => ({ ...c, appointmentNotes: e.target.value }))} className={`${inputClass} min-h-[86px] py-3`} /></Field>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <button type="submit" disabled={memberSaving} className="primary-btn disabled:cursor-not-allowed disabled:opacity-60">{memberSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editingMemberId ? 'Update Office Bearer' : 'Add Office Bearer'}</button>
                  {editingMemberId ? <button type="button" onClick={resetMemberForm} className="secondary-btn">Cancel Edit</button> : null}
                </div>
              </div>
            </form>
          </div>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Office Bearers</h2>
                <p className="mt-1 text-sm text-slate-500">{committeeMembers.length} assigned member{committeeMembers.length === 1 ? '' : 's'}.</p>
              </div>
              <Users className="h-6 w-6 text-emerald-700" />
            </div>

            {committeeMembers.length === 0 ? <StateCard message="No office bearers assigned yet." /> : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {committeeMembers.map((member) => (
                <article key={member.id} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{member.designation_title}</p>
                      <h3 className="mt-1 text-xl font-black text-slate-950">{member.full_name_snapshot}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{member.member_no_snapshot ?? 'No member no'} · Father: {member.father_name_snapshot ?? 'N/A'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ring-1 ${getCommitteeStatusClass(member.status)}`}>{getCommitteeStatusLabel(member.status)}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <Info label="Location" value={`${member.district_snapshot ?? 'N/A'}${member.taluka_snapshot ? ` · ${member.taluka_snapshot}` : ''}`} />
                    <Info label="Order" value={String(member.sort_order)} />
                    <Info label="Tenure" value={`${formatCommitteeDate(member.tenure_start)} → ${formatCommitteeDate(member.tenure_end)}`} />
                    <Info label="Updated" value={formatCommitteeDate(member.updated_at)} />
                  </div>

                  {member.appointment_notes ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">{member.appointment_notes}</p> : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => startEditMember(member)} className="secondary-btn"><Edit3 size={15} /> Edit</button>
                    <button type="button" onClick={() => void handleRemoveMember(member.id)} className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100"><Trash2 size={15} /> Remove</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-800">{label}</span>{children}</label>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-950">{value}</p></div>
}

function StateCard({ message, tone = 'default' }: { message: string; tone?: 'default' | 'error' }) {
  return <div className={`rounded-2xl p-5 text-sm font-bold ring-1 ${tone === 'error' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{tone === 'error' ? <ShieldAlert className="mr-2 inline h-4 w-4" /> : null}{message}</div>
}
