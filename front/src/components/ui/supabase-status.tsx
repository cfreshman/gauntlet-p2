import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function SupabaseStatus() {
  const [status, setStatus] = useState<'connected' | 'error'>('connected');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      try {
        const start = performance.now();
        // Simple health check using a lightweight query
        const { error } = await supabase
          .from('profiles')
          .select('count', { count: 'exact', head: true });
          
        const end = performance.now();
        
        if (error) throw error;
        if (mounted) {
          setStatus('connected');
          setLatency(Math.round(end - start));
        }
      } catch (err) {
        if (mounted) {
          setStatus('error');
          setLatency(null);
        }
      }
    }

    const interval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="text-sm text-muted-foreground flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
      {status === 'connected' ? (
        latency !== null ? `${latency}ms` : 'connecting...'
      ) : (
        'disconnected'
      )}
    </div>
  );
} 