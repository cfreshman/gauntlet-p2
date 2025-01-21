import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';

export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check for recovery token on load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Allow if user is logged in or has recovery token
      if (!session?.user && !user) {
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        // Handle Supabase's "Password should be different from the old password" error
        if (error.message.includes('different from the old password')) {
          throw new Error('new password must be different');
        }
        throw error;
      }

      // Password updated successfully
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'update failed');
    } finally {
      setLoading(false);
    }
  }

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
                type="password"
                placeholder="new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <Button className="w-full" disabled={loading}>
              {loading ? 'updating...' : 'update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 