import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/hooks/useAuth';
import TeamMembers from '../components/settings/TeamMembers';
import { UnclaimedWorkers } from '../components/settings/UnclaimedWorkers';
import { FieldManager } from '../components/settings/FieldManager';

type Status = {
  type: 'error' | 'success' | null;
  message: string;
};

type TeamInvite = {
  id: string;
  email: string;
  role: 'worker' | 'manager';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  magic_link?: string;
};

export function Settings() {
  const { profile, updateUsername, updatePassword, updateEmail } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [usernameStatus, setUsernameStatus] = useState<Status>({ type: null, message: '' });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: null, message: '' });
  const [emailStatus, setEmailStatus] = useState<Status>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const [roleStatus, setRoleStatus] = useState<Status>({ type: null, message: '' });
  const [inviteRole, setInviteRole] = useState<'worker' | 'manager'>('worker');
  const [inviteStatus, setInviteStatus] = useState<Status>({ type: null, message: '' });
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamStatus, setTeamStatus] = useState<Status>({ type: null, message: '' });
  const [hasTeam, setHasTeam] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Fetch users and invites if current user is a manager
  useEffect(() => {
    if (profile?.role === 'manager') {
      fetchUsers();
      fetchInvites();
      checkForTeam();
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username');

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function fetchInvites() {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add signup URL to each invite
      const invitesWithLinks = data.map(invite => ({
        ...invite,
        magic_link: `${window.location.origin}/signup?invite=${invite.id}`
      }));
      
      console.log('Fetched invites:', invitesWithLinks);
      setInvites(invitesWithLinks);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  }

  async function checkForTeam() {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      setHasTeam(!!data);
      setTeamId(data?.team_id);
    } catch (error) {
      console.error('Error checking for team:', error);
    }
  }

  async function updateUserRole(userId: string, newRole: 'customer' | 'worker' | 'manager') {
    if (!profile || profile.role !== 'manager') return;
    
    setRoleStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ id: userId, role: newRole })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      setRoleStatus({ type: 'success', message: 'role updated' });
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Error updating role:', error);
      setRoleStatus({ type: 'error', message: 'failed to update role' });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const { error } = await updateUsername(username);
      if (error) throw error;
      setUsernameStatus({ type: 'success', message: 'username updated' });
    } catch (err) {
      if (typeof err === 'string') {
        setUsernameStatus({ type: 'error', message: err });
      } else {
        setUsernameStatus({ type: 'error', message: 'update failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: '' });

    if (password.length < 6) {
      setPasswordStatus({ type: 'error', message: 'password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setPasswordStatus({ type: 'success', message: 'password updated' });
      setPassword('');
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err === 'weak password' ? 'password is too weak' : 'update failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setUsernameStatus({ type: null, message: '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordStatus({ type: null, message: '' });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus({ type: null, message: '' });
    setLoading(true);

    try {
      await updateEmail(email);
      setEmailStatus({ type: 'success', message: 'email updated' });
    } catch (err) {
      if (typeof err === 'string') {
        setEmailStatus({ type: 'error', message: err });
      } else {
        setEmailStatus({ type: 'error', message: 'update failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailStatus({ type: null, message: '' });
  };

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (profile?.role !== 'manager') return;

    setInviteStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-team-member`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ role: inviteRole })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      // Construct signup URL with role in it
      const signupUrl = `${window.location.origin}/signup?invite=${data.invite_id}`

      // Copy link immediately
      navigator.clipboard.writeText(signupUrl);
      setCopiedInviteId(data.invite_id);
      setTimeout(() => setCopiedInviteId(null), 2000);

      setInviteStatus({ type: 'success', message: 'invite created and copied to clipboard' });
      setInvites(prev => [{
        id: data.invite_id,
        email: '',
        role: inviteRole,
        status: 'pending',
        created_at: new Date().toISOString(),
        magic_link: signupUrl
      }, ...prev]);
    } catch (error) {
      console.error('Error creating invite:', error);
      setInviteStatus({ type: 'error', message: typeof error === 'string' ? error : 'failed to create invite' });
    } finally {
      setLoading(false);
    }
  }

  const copyInviteLink = (inviteId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || profile.role !== 'manager') return;
    
    setTeamStatus({ type: null, message: '' });
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-team`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ name: teamName })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw data.error;
      }

      setTeamStatus({ type: 'success', message: 'team created' });
      setTeamName('');
      window.location.reload(); // Reload to update UI with new team
    } catch (error) {
      console.error('Error creating team:', error);
      setTeamStatus({ type: 'error', message: 'failed to create team' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">settings</h1>
      
      <div className="space-y-6">
        {profile?.role === 'manager' && (
          <>
            {!hasTeam && (
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <form onSubmit={handleCreateTeam}>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">team name</label>
                      <Input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        disabled={loading}
                        placeholder="enter team name"
                      />
                      {teamStatus.message && (
                        <p className={`text-sm ${teamStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                          {teamStatus.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={loading || !teamName} className="mt-2">
                      create team
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {(profile?.role === 'manager' || profile?.role === 'worker') && (
          <TeamMembers />
        )}

        {profile?.role === 'manager' && hasTeam && (
          <Card>
            <CardContent className="pt-4">
              <FieldManager teamId={teamId} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={loading}
                />
                {usernameStatus.message && (
                  <p className={`text-sm ${usernameStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {usernameStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update username
              </Button>
            </form>

            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">new password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
                {passwordStatus.message && (
                  <p className={`text-sm ${passwordStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {passwordStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update password
              </Button>
            </form>

            <form onSubmit={handleEmailSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-gray-600">email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                />
                {emailStatus.message && (
                  <p className={`text-sm ${emailStatus.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {emailStatus.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading} className="mt-2">
                update email
              </Button>
            </form>
          </CardContent>
        </Card>

        {profile?.role === 'manager' && hasTeam && (
          <UnclaimedWorkers />
        )}
      </div>
    </div>
  );
} 