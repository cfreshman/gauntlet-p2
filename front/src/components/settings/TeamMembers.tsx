import { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { PendingInvites } from './PendingInvites'
import { useTeamMembers } from '../../lib/hooks/useTeamMembers'
import { supabase } from '../../lib/supabase'

export default function TeamMembers() {
  const { profile } = useAuth()
  const { usernames } = useUsernames()
  const { workers, teamMember, loading, error, unassignWorker } = useTeamMembers(profile?.id)
  const [editingName, setEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [roleLoading, setRoleLoading] = useState<string | null>(null)

  async function renameTeam() {
    if (!teamMember?.team_id || !newTeamName) return

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newTeamName })
        .eq('id', teamMember.team_id)

      if (error) throw error

      setEditingName(false)
    } catch (error) {
      console.error('Error renaming team:', error)
    }
  }

  async function promoteToManager(userId: string) {
    if (!profile || profile.role !== 'manager') return
    setRoleLoading(userId)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ id: userId, role: 'manager' })
        }
      )

      const data = await response.json()
      
      if (data.error) {
        throw data.error
      }

      // Refresh the workers list
      window.location.reload()
    } catch (error) {
      console.error('Error promoting to manager:', error)
    } finally {
      setRoleLoading(null)
    }
  }

  if (!profile || (profile.role !== 'manager' && profile.role !== 'worker')) return null
  if (loading) return <div>loading workers...</div>
  if (!teamMember) return profile.role === 'manager' ? <div>create a team to manage workers</div> : null

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            {profile.role === 'manager' && editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={teamMember?.name}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={renameTeam}
                  disabled={!newTeamName}
                >
                  save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingName(false)
                    setNewTeamName('')
                  }}
                >
                  cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">
                  {teamMember?.name || 'team members'}
                </h3>
                {profile.role === 'manager' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingName(true)
                      setNewTeamName(teamMember?.name || '')
                    }}
                  >
                    rename
                  </Button>
                )}
              </div>
            )}
          </div>

          {workers.length === 0 ? (
            <p className="text-sm text-gray-500">no workers on your team</p>
          ) : (
            <div className="space-y-2">
              {workers.map(worker => (
                <div key={worker.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{usernames[worker.id] || worker.username}</span>
                    <span className="text-xs text-gray-500">({worker.role})</span>
                  </div>
                  {profile.role === 'manager' && worker.role === 'worker' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteToManager(worker.id)}
                        disabled={roleLoading === worker.id}
                      >
                        {roleLoading === worker.id ? 'promoting...' : 'promote to manager'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unassignWorker(worker.id)}
                      >
                        remove from team
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {profile.role === 'manager' && <PendingInvites />}
      </CardContent>
    </Card>
  )
} 