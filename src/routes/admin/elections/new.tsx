import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createElection, electionLevelOptions } from '@/lib/elections'
import type { ElectionRecord } from '@/lib/elections'

export const Route = createFileRoute('/admin/elections/new')({
  component: CreateElectionPage,
})

function CreateElectionPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    level: 'central' as const,
    division: '',
    district: '',
    taluka: '',
    term_start: '',
    term_end: '',
    nomination_start: '',
    nomination_end: '',
    voting_start: '',
    voting_end: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const input: Partial<ElectionRecord> = {
        title: formData.title,
        level: formData.level,
        division: formData.division || null,
        district: formData.district || null,
        taluka: formData.taluka || null,
        term_start: formData.term_start,
        term_end: formData.term_end,
        nomination_start: formData.nomination_start ? new Date(formData.nomination_start).toISOString() : null,
        nomination_end: formData.nomination_end ? new Date(formData.nomination_end).toISOString() : null,
        voting_start: formData.voting_start ? new Date(formData.voting_start).toISOString() : null,
        voting_end: formData.voting_end ? new Date(formData.voting_end).toISOString() : null,
      }

      const election = await createElection(input)
      navigate({ to: `/admin/elections/${election.id}` })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create election')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Election</h1>
        <p className="text-muted-foreground mt-2">Set up a new election process</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Election Details</CardTitle>
          <CardDescription>Provide basic information about the election</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title">Election Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Central Election 2026"
                required
              />
            </div>

            <div>
              <Label htmlFor="level">Election Level *</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value as any })}>
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {electionLevelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.level === 'divisional' && (
              <div>
                <Label htmlFor="division">Division</Label>
                <Input
                  id="division"
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  placeholder="Division name"
                />
              </div>
            )}

            {(formData.level === 'district' || formData.level === 'taluka') && (
              <div>
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District name"
                  required
                />
              </div>
            )}

            {formData.level === 'taluka' && (
              <div>
                <Label htmlFor="taluka">Taluka *</Label>
                <Input
                  id="taluka"
                  value={formData.taluka}
                  onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                  placeholder="Taluka name"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="term_start">Term Start Date *</Label>
                <Input
                  id="term_start"
                  type="date"
                  value={formData.term_start}
                  onChange={(e) => setFormData({ ...formData, term_start: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="term_end">Term End Date *</Label>
                <Input
                  id="term_end"
                  type="date"
                  value={formData.term_end}
                  onChange={(e) => setFormData({ ...formData, term_end: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomination_start">Nomination Start</Label>
                <Input
                  id="nomination_start"
                  type="datetime-local"
                  value={formData.nomination_start}
                  onChange={(e) => setFormData({ ...formData, nomination_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nomination_end">Nomination End</Label>
                <Input
                  id="nomination_end"
                  type="datetime-local"
                  value={formData.nomination_end}
                  onChange={(e) => setFormData({ ...formData, nomination_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voting_start">Voting Start</Label>
                <Input
                  id="voting_start"
                  type="datetime-local"
                  value={formData.voting_start}
                  onChange={(e) => setFormData({ ...formData, voting_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="voting_end">Voting End</Label>
                <Input
                  id="voting_end"
                  type="datetime-local"
                  value={formData.voting_end}
                  onChange={(e) => setFormData({ ...formData, voting_end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Election'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
