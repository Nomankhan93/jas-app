import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { fetchElectionDetails, fetchElectionPositions, fetchElectionCandidates, castVote } from '@/lib/elections'
import type { ElectionRecord, ElectionPositionRecord, ElectionCandidateRecord } from '@/lib/elections'

export const Route = createFileRoute('/elections/$id')({
  component: VotingPage,
  loader: async ({ params }) => {
    const election = await fetchElectionDetails(params.id)
    const positions = election ? await fetchElectionPositions(params.id) : []
    const candidates = election ? await fetchElectionCandidates(params.id) : []
    return { election, positions, candidates }
  },
})

function VotingPage() {
  const { election, positions, candidates } = useLoaderData({ from: '/elections/$id' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const [confirmingVote, setConfirmingVote] = useState<{
    positionId: string
    candidateId: string
    candidateName: string
  } | null>(null)

  if (!election) {
    return <div className="text-center py-8">Election not found</div>
  }

  const handleVote = async () => {
    if (!confirmingVote) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await castVote(election.id, confirmingVote.positionId, confirmingVote.candidateId)
      setSuccess('Vote cast successfully!')
      setConfirmingVote(null)
      setSelectedCandidate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote')
    } finally {
      setLoading(false)
    }
  }

  const candidatesByPosition = new Map<string, ElectionCandidateRecord[]>()
  candidates.forEach((candidate) => {
    if (!candidatesByPosition.has(candidate.position_id)) {
      candidatesByPosition.set(candidate.position_id, [])
    }
    candidatesByPosition.get(candidate.position_id)!.push(candidate)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{election.title}</h1>
        <p className="text-muted-foreground mt-2">Cast your votes for the available positions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {positions.map((position) => {
          const positionCandidates = candidatesByPosition.get(position.id) || []

          return (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle>{position.title}</CardTitle>
                <CardDescription>
                  {position.seats === 1 ? 'Select 1 candidate' : `Select up to ${position.seats} candidates`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {positionCandidates.length === 0 ? (
                  <p className="text-muted-foreground">No approved candidates for this position</p>
                ) : (
                  <div className="grid gap-4">
                    {positionCandidates.map((candidate) => (
                      <Card key={candidate.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{candidate.member?.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Member No: {candidate.member?.member_no || 'N/A'}
                              </p>
                              {candidate.manifesto && (
                                <p className="text-sm mt-2 text-gray-700">{candidate.manifesto}</p>
                              )}
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setSelectedCandidate(candidate.id)
                                    setConfirmingVote({
                                      positionId: position.id,
                                      candidateId: candidate.id,
                                      candidateName: candidate.member?.full_name || 'Unknown',
                                    })
                                  }}
                                >
                                  Vote
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Your Vote</DialogTitle>
                                  <DialogDescription>
                                    You are about to vote for <strong>{confirmingVote?.candidateName}</strong> for the
                                    position of <strong>{position.title}</strong>.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
                                  After submission, your vote cannot be changed. Please ensure you have selected the
                                  correct candidate.
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setConfirmingVote(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleVote} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Confirm Vote'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
