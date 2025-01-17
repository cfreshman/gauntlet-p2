import { useState } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';

type Status = {
  type: 'error' | 'success' | null;
  message: string;
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

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <div className="flex flex-col gap-4 w-[320px]">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-4">
              {usernameStatus.message && (
                <p className={`mb-2 text-sm ${
                  usernameStatus.type === 'error' ? 'text-destructive' : 'text-primary'
                }`}>
                  {usernameStatus.message}
                </p>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={handleUsernameChange}
                  autoCapitalize="none"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={loading}>
                {loading ? 'updating...' : 'update username'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <form onSubmit={handleEmailSubmit}>
            <CardContent className="pt-4">
              {emailStatus.message && (
                <p className={`mb-2 text-sm ${
                  emailStatus.type === 'error' ? 'text-destructive' : 'text-primary'
                }`}>
                  {emailStatus.message}
                </p>
              )}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={handleEmailChange}
                  autoCapitalize="none"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={loading}>
                {loading ? 'updating...' : 'update email'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="pt-4">
              {passwordStatus.message && (
                <p className={`mb-2 text-sm ${
                  passwordStatus.type === 'error' ? 'text-destructive' : 'text-primary'
                }`}>
                  {passwordStatus.message}
                </p>
              )}
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="new password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={loading || password.length < 6}>
                {loading ? 'updating...' : 'update password'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 