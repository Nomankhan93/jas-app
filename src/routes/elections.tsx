import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchElections, electionStatusOptions, electionLevelOptions } from '@/lib/elections'
import type { ElectionRecord } from '@/lib/elections'

export const Route = createFileRoute('/elections')({
  component: ElectionsPage,
  loader: async () => {
    const elections = await fetchElections()
    return elections.filter(
      (e) =>
        e.status !== 'draft' &&
        e.status !== 'cancelled' &&
        (e.status === 'voting_open' || e.status === 'results_published'),
    )
  },
})

function ElectionsPage() {
  const elections = useLoaderData({ from: '/elections' })

  const getStatusBadge = (status: string) => {
    const statusOption = electionStatusOptions.find((s) => s.value === status)
    const colorMap: Record<string, string> = {
      voting_open: 'bg-green-100 text-green-800',
      results_published: 'bg-emerald-100 text-emerald-800',
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Elections</h1>
        <p className="text-muted-foreground mt-2">Participate in active elections and view results</p>
      </div>

      {elections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No active elections at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {elections.map((election) => (
            <Card key={election.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{election.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span>Level: {getLevelLabel(election.level)}</span>
                        <span>Area: {getAreaDisplay(election)}</span>
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
                  {election.status === 'voting_open' && (
                    <Link to={`/elections/${election.id}`}>
                      <Button>Vote Now</Button>
                    </Link>
                  )}
                  {election.status === 'results_published' && (
                    <Link to={`/elections/${election.id}/results`}>
                      <Button variant="outline">View Results</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
