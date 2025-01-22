import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/hooks/useAuth'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface TeamInvite {
  id: string
  role: 'worker' | 'manager'
  status: 'pending' | 'accepted' | 'expired'
  team_id: string
  invited_by: string
  created_at: string
  magic_link?: string
}

export function PendingInvites() {
  const { profile } = useAuth()
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteRole, setInviteRole] = useState<'worker' | 'manager'>('worker')
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [teamMember, setTeamMember] = useState<{ team_id: string } | null>(null)

  useEffect(() => {
    if (profile) {
      loadInvites()

      // Subscribe to team_invites changes
      const channel = supabase
        .channel('pending-invites')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_invites'
          },
          () => {
            loadInvites()
          }
        )
        .subscribe()

      return () => {
        channel.unsubscribe()
      }
    }
  }, [profile])

  async function loadInvites() {
    if (!profile) return

    try {
      // Get manager's team first
      const { data: tm, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (teamError) {
        console.error('Error loading team:', teamError)
        setError('failed to load team')
        return
      }

      setTeamMember(tm)

      // Load invites for team if exists
      if (tm) {
        const { data, error } = await supabase
          .from('team_invites')
          .select('*')
          .eq('team_id', tm.team_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        const invitesWithLinks = data.map(invite => ({
          ...invite,
          magic_link: `${window.location.origin}/signup?invite=${invite.id}`
        }))

        setInvites(invitesWithLinks)
      } else {
        setInvites([])
      }
    } catch (error) {
      console.error('Error loading invites:', error)
      setError('failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  async function createInvite() {
    if (!profile || !teamMember) return
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-team-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ 
            role: inviteRole,
            team_id: teamMember.team_id
          })
        }
      )

      const data = await response.json()
      
      if (data.error) throw data.error

      const signupUrl = `${window.location.origin}/signup?invite=${data.invite_id}`
      
      navigator.clipboard.writeText(signupUrl)
      setCopiedInviteId(data.invite_id)
      setTimeout(() => setCopiedInviteId(null), 2000)

      await loadInvites()
    } catch (error) {
      console.error('Error creating invite:', error)
      setError('failed to create invite')
    }
  }

  const copyInviteLink = (inviteId: string, link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedInviteId(inviteId)
    setTimeout(() => setCopiedInviteId(null), 2000)
  }

  if (!profile || profile.role !== 'manager') return null
  if (loading) return (
    <div className="flex items-center justify-center h-32 text-primary/70">
      loading invites...
    </div>
  )
  if (!teamMember) return <div>create a team to manage invites</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={inviteRole} onValueChange={(value: 'worker' | 'manager') => setInviteRole(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worker">worker</SelectItem>
            <SelectItem value="manager">manager</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={createInvite}>
          create invite
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {invites.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">pending invites</h3>
          {invites.map(invite => (
            <div key={invite.id} className="flex items-center justify-between">
              <div className="text-sm">
                {invite.role}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => invite.magic_link && copyInviteLink(invite.id, invite.magic_link)}
              >
                {copiedInviteId === invite.id ? 'copied!' : 'copy invite link'}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-primary/70">no pending invites</div>
      )}
    </div>
  )
} 