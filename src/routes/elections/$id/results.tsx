import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchElectionDetails, fetchElectionResults } from '@/lib/elections'
import type { ElectionResult } from '@/lib/elections'

export const Route = createFileRoute('/elections/$id/results')({
  component: ElectionResultsPage,
  loader: async ({ params }) => {
    const election = await fetchElectionDetails(params.id)
    const results = election && election.status === 'results_published' ? await fetchElectionResults(params.id) : []
    return { election, results }
  },
})

function ElectionResultsPage() {
  const { election, results } = useLoaderData({ from: '/elections/$id/results' })

  if (!election) {
    return <div className="text-center py-8">Election not found</div>
  }

  if (election.status !== 'results_published') {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold">Results not yet published</p>
        <p className="text-muted-foreground">Results will be available once the election is complete and verified.</p>
      </div>
    )
  }

  // Group results by position
  const resultsByPosition = new Map<string, ElectionResult[]>()
  results.forEach((result) => {
    if (!resultsByPosition.has(result.position_id)) {
      resultsByPosition.set(result.position_id, [])
    }
    resultsByPosition.get(result.position_id)!.push(result)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{election.title} - Results</h1>
        <p className="text-muted-foreground mt-2">Official election results</p>
      </div>

      <div className="space-y-6">
        {Array.from(resultsByPosition.entries()).map(([positionId, positionResults]) => {
          const winners = positionResults.filter((r) => r.is_winner)
          const totalVotes = positionResults.reduce((sum, r) => sum + r.vote_count, 0)

          return (
            <Card key={positionId}>
              <CardHeader>
                <CardTitle>{positionResults[0]?.position_title}</CardTitle>
                <CardDescription>Total votes: {totalVotes}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {winners.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">
                        {winners.length === 1 ? 'Winner' : 'Winners'}
                      </h3>
                      <div className="space-y-2">
                        {winners.map((result) => (
                          <div key={result.candidate_id} className="bg-green-50 border border-green-200 p-3 rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{result.candidate_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Member No: {result.member_no || 'N/A'}
                                </p>
                              </div>
                              <Badge className="bg-green-600">
                                {result.vote_count} {result.vote_count === 1 ? 'vote' : 'votes'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">All Candidates</h3>
                    <div className="space-y-2">
                      {positionResults
                        .sort((a, b) => b.vote_count - a.vote_count)
                        .map((result) => (
                          <div
                            key={result.candidate_id}
                            className={`border p-3 rounded ${result.is_winner ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{result.candidate_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Member No: {result.member_no || 'N/A'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${result.is_winner ? 'bg-green-600' : 'bg-blue-600'}`}
                                    style={{
                                      width: `${totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                                <Badge variant={result.is_winner ? 'default' : 'secondary'}>
                                  {result.vote_count} {result.vote_count === 1 ? 'vote' : 'votes'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
