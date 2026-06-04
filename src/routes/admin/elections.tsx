import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchElections, electionStatusOptions, electionLevelOptions } from '@/lib/elections'
import type { ElectionRecord } from '@/lib/elections'

export const Route = createFileRoute('/admin/elections')({
  component: AdminElectionsPage,
  loader: async () => {
    return await fetchElections()
  },
})

function AdminElectionsPage() {
  const elections = useLoaderData({ from: '/admin/elections' })
  const [filteredElections, setFilteredElections] = useState<ElectionRecord[]>(elections)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredElections(elections)
    } else {
      setFilteredElections(elections.filter((e) => e.status === statusFilter))
    }
  }, [statusFilter, elections])

  const getStatusBadge = (status: string) => {
    const statusOption = electionStatusOptions.find((s) => s.value === status)
    const colorMap: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-800',
      nominations_open: 'bg-blue-100 text-blue-800',
      scrutiny: 'bg-amber-100 text-amber-800',
      campaign: 'bg-purple-100 text-purple-800',
      voter_list_frozen: 'bg-cyan-100 text-cyan-800',
      voting_open: 'bg-green-100 text-green-800',
      voting_closed: 'bg-orange-100 text-orange-800',
      results_published: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={colorMap[status] || 'bg-slate-100 text-slate-800'}>
        {statusOption?.label || status}
      </Badge>
    )
  }

  const getLevelLabel = (level: string) => {
    return electionLevelOptions.find((l) => l.value === level)?.label || level
  }

  const getAreaDisplay = (election: ElectionRecord) => {
    if (election.level === 'central') return 'Central'
    if (election.level === 'divisional') return election.division || 'Divisional'
    if (election.level === 'district') return election.district || 'District'
    if (election.level === 'taluka') return `${election.taluka}, ${election.district}`
    return 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Elections</h1>
          <p className="text-muted-foreground mt-2">Manage all elections and voting processes</p>
        </div>
        <Link to="/admin/elections/new">
          <Button>Create Election</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Elections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            {electionStatusOptions.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredElections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No elections found</p>
            </CardContent>
          </Card>
        ) : (
          filteredElections.map((election) => (
            <Card key={election.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{election.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span>Level: {getLevelLabel(election.level)}</span>
                        <span>Area: {getAreaDisplay(election)}</span>
                        <span>
                          Term: {new Date(election.term_start).toLocaleDateString()} -{' '}
                          {new Date(election.term_end).toLocaleDateString()}
                        </span>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(election.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Link to={`/admin/elections/${election.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                  <Link to={`/admin/elections/${election.id}/candidates`}>
                    <Button variant="outline">Manage Candidates</Button>
                  </Link>
                  <Link to={`/admin/elections/${election.id}/voters`}>
                    <Button variant="outline">Voter List</Button>
                  </Link>
                  <Link to={`/admin/elections/${election.id}/results`}>
                    <Button variant="outline">Results</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
