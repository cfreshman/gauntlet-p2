import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function SupabaseStatus() {
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkLatency() {
      try {
        const start = performance.now();
        const { error } = await supabase.auth.getSession();
        const end = performance.now();
        
        if (error) throw error;
        if (mounted) setLatency(Math.round(end - start));
      } catch (err) {
        if (mounted) setError('connection error');
      }
    }

    const interval = setInterval(checkLatency, 1000);
    checkLatency(); // Initial check

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="text-sm text-muted-foreground">
      {error ? (
        <span className="text-destructive">{error}</span>
      ) : (
        <span>latency: {latency}ms</span>
      )}
    </div>
  );
} 