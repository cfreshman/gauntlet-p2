import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function ResetPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ identifier })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Card className="w-[320px]">
        {success ? (
          <CardContent className="pt-4 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              check your email for a reset link
            </p>
            <Button variant="ghost" asChild className="w-full">
              <Link to="/login">back to login</Link>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-4">
              {error && (
                <p className="mb-2 text-sm text-destructive">{error}</p>
              )}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  disabled={loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button className="w-full" disabled={loading}>
                {loading ? 'sending...' : 'reset password'}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">back to login</Link>
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
} 