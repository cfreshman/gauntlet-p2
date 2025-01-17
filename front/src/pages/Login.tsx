import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardFooter } from '../components/ui/card';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(username, password);
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
              {loading ? 'signing in...' : 'sign in'}
            </Button>
            <Link
              to="/signup"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              need an account?
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 