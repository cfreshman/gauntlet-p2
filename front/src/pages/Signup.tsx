import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { supabase } from '../lib/supabase';

export function Signup() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState<string | null>(null);
  const { signUp } = useAuth();
  const inviteId = searchParams.get('invite');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Properly construct the from path
  const from = location.state?.from 
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/';

  useEffect(() => {
    async function fetchInvite() {
      if (!inviteId) return;
      
      try {
        const { data, error } = await supabase
          .from('team_invites')
          .select('role')
          .eq('id', inviteId)
          .eq('status', 'pending')
          .single();

        if (error) throw error;
        if (data) setInviteRole(data.role);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('invalid or expired invite');
      }
    }

    fetchInvite();
  }, [inviteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, username, password, inviteId);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-4">
            <div className="text-center mb-4">
              {inviteRole ? (
                <p className="text-sm text-gray-600 mb-2">create {inviteRole} account</p>
              ) : (
                <p className="text-sm text-gray-600 mb-2">create your account</p>
              )}
            </div>
            {error && (
              <p className="mb-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                disabled={loading}
              />
              <Input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                disabled={loading}
              />
              <Input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button className="w-full" disabled={loading}>
              {loading ? 'signing up...' : 'sign up'}
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/login" state={location.state}>have an account?</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 