import { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { useUsernames } from '../../lib/hooks/useUsernames'
import { PendingInvites } from './PendingInvites'
import { useTeamManagement } from '../../lib/hooks/useTeamManagement'
import { supabase } from '../../lib/supabase'

export default function TeamMembers() {
  const { profile } = useAuth()
  const { usernames } = useUsernames()
  const { members, team, loading, error, unassignWorker, leaveTeam } = useTeamManagement(profile?.id)
  const [editingName, setEditingName] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [roleLoading, setRoleLoading] = useState<string | null>(null)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  // Check if there are other managers
  const otherManagers = members.filter(m => m.role === 'manager' && m.id !== profile?.id)
  const canLeave = otherManagers.length > 0

  async function renameTeam() {
    if (!team?.id || !newTeamName) return

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newTeamName })
        .eq('id', team.id)

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

  async function handleLeaveTeam() {
    if (!profile || profile.role !== 'manager') return
    setLeaveError(null)

    try {
      await leaveTeam()
      window.location.reload() // Refresh to show create team form
    } catch (error) {
      if (error instanceof Error && error.message === 'promote another team member to manager before leaving') {
        setLeaveError('promote a team member to manager first')
      } else {
        setLeaveError('failed to leave team')
      }
    }
  }

  if (!profile || (profile.role !== 'manager' && profile.role !== 'worker')) return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading workers...
    </div>
  )
  if (!team) return profile.role === 'manager' ? <div>create a team to manage workers</div> : null

  // Show all members, not just workers
  const teamMembers = members.sort((a, b) => {
    // Sort by role (managers first) then by username
    if (a.role === b.role) {
      return (usernames[a.id] || a.username).localeCompare(usernames[b.id] || b.username)
    }
    return a.role === 'manager' ? -1 : 1
  })

  return (
    <Card>
      <CardContent className="space-y-6 pt-4">
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        {leaveError && (
          <div className="text-sm text-primary/70">{leaveError}</div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            {profile.role === 'manager' && editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder={team?.name}
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
                  {team?.name || 'team members'}
                </h3>
                {profile.role === 'manager' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingName(true)
                        setNewTeamName(team?.name || '')
                      }}
                    >
                      rename
                    </Button>
                    {canLeave && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLeaveTeam}
                      >
                        leave team
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {teamMembers.length === 0 ? (
            <p className="text-sm text-primary/70">no members on your team</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{usernames[member.id] || member.username}</span>
                    <span className="text-xs text-primary/70">({member.role})</span>
                  </div>
                  {profile.role === 'manager' && member.role === 'worker' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteToManager(member.id)}
                        disabled={roleLoading === member.id}
                      >
                        {roleLoading === member.id ? 'promoting...' : 'promote to manager'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unassignWorker(member.id)}
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