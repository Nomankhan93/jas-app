import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchElectionDetails, electionStatusOptions, electionLevelOptions, updateElection } from '@/lib/elections'
import type { ElectionRecord } from '@/lib/elections'

export const Route = createFileRoute('/admin/elections/$id')({
  component: ElectionDetailPage,
  loader: async ({ params }) => {
    return await fetchElectionDetails(params.id)
  },
})

function ElectionDetailPage() {
  const election = useLoaderData({ from: '/admin/elections/$id' })
  const [loading, setLoading] = useState(false)

  if (!election) {
    return <div className="text-center py-8">Election not found</div>
  }

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

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      await updateElection(election.id, { status: newStatus as any })
      window.location.reload()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{election.title}</h1>
          <p className="text-muted-foreground mt-2">Election Management</p>
        </div>
        <div>{getStatusBadge(election.status)}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Election Level</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{getLevelLabel(election.level)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Term Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {new Date(election.term_start).toLocaleDateString()} -{' '}
              {new Date(election.term_end).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {election.nomination_start && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Nomination Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {new Date(election.nomination_start).toLocaleDateString()} -{' '}
                {new Date(election.nomination_end!).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {election.voting_start && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Voting Period</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {new Date(election.voting_start).toLocaleDateString()} -{' '}
                {new Date(election.voting_end!).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Election Status Timeline</CardTitle>
          <CardDescription>Update the election status through its lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {electionStatusOptions.map((status) => (
              <Button
                key={status.value}
                variant={election.status === status.value ? 'default' : 'outline'}
                onClick={() => handleStatusChange(status.value)}
                disabled={loading || election.status === status.value}
                size="sm"
              >
                {status.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Link to={`/admin/elections/${election.id}/candidates`}>
          <Button className="w-full" variant="outline">
            Manage Candidates
          </Button>
        </Link>
        <Link to={`/admin/elections/${election.id}/voters`}>
          <Button className="w-full" variant="outline">
            Voter List
          </Button>
        </Link>
        <Link to={`/admin/elections/${election.id}/results`}>
          <Button className="w-full" variant="outline">
            Results
          </Button>
        </Link>
      </div>
    </div>
  )
}
