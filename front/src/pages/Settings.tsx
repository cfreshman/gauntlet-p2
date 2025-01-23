import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useTheme } from '../lib/hooks/useTheme';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { supabase } from '../lib/supabase';
import TeamMembers from '../components/settings/TeamMembers';
import { UnclaimedWorkers } from '../components/settings/UnclaimedWorkers';
import { FieldManager } from '../components/settings/FieldManager';
import { SkillManager } from '../components/settings/SkillManager'

type Status = {
  type: 'error' | 'success' | null;
  message: string;
};

export function Settings() {
  const { profile, updateUsername, updatePassword, updateEmail } = useAuth();
  const { primaryColor, setPrimaryColor } = useTheme();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [usernameStatus, setUsernameStatus] = useState<Status>({ type: null, message: '' });
  const [passwordStatus, setPasswordStatus] = useState<Status>({ type: null, message: '' });
  const [emailStatus, setEmailStatus] = useState<Status>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamStatus, setTeamStatus] = useState<Status>({ type: null, message: '' });
  const [hasTeam, setHasTeam] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  // Convert HSL to hex for color input
  const [currentColor, setCurrentColor] = useState(primaryColor);
  const [hue, saturation, lightness] = currentColor.split(' ').map(val => val.replace('%', ''));

  // Update local state when primaryColor changes
  useEffect(() => {
    setCurrentColor(primaryColor);
  }, [primaryColor]);

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert hex to HSL for theme
  const hexToHsl = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Fetch users and invites if current user is a manager
  useEffect(() => {
    if (profile?.role === 'manager') {
      checkForTeam();
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

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
        {/* Team management section */}
        {profile?.role === 'manager' && (
          <>
            {!hasTeam && (
              <Card>
                <CardContent className="space-y-4 pt-4">
                  <form onSubmit={handleCreateTeam}>
                    <div className="space-y-2">
                      <label className="text-sm text-primary/70">team name</label>
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

        {/* Team members section */}
        {(profile?.role === 'manager' || profile?.role === 'worker') && (
          <TeamMembers />
        )}

        {/* Skills section */}
        {(profile?.role === 'manager' || profile?.role === 'worker') && (
          <Card>
            <CardContent className="pt-4">
              <SkillManager teamId={teamId} />
            </CardContent>
          </Card>
        )}

        {/* Field manager section */}
        {profile?.role === 'manager' && hasTeam && (
          <Card>
            <CardContent className="pt-4">
              <FieldManager teamId={teamId} />
            </CardContent>
          </Card>
        )}

        {/* User settings section */}
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm text-primary/70">theme color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(Number(hue), Number(saturation), Number(lightness))}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    if (hsl) setPrimaryColor(hsl);
                  }}
                  className="w-12 h-9 p-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setPrimaryColor('49 100% 50%')}
                  size="sm"
                >
                  reset
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-primary/70">username</label>
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
                <label className="text-sm text-primary/70">new password</label>
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
                <label className="text-sm text-primary/70">email</label>
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

        {/* Unclaimed workers section */}
        {profile?.role === 'manager' && hasTeam && (
          <UnclaimedWorkers />
        )}
      </div>
    </div>
  );
} 