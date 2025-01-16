import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [envStatus, setEnvStatus] = useState<{url: boolean, key: boolean}>({
    url: false,
    key: false
  });

  useEffect(() => {
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvStatus({
      url: !!supabaseUrl,
      key: !!supabaseKey
    });

    async function testConnection() {
      try {
        // Simple health check using auth
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error(`Supabase Error: ${error.message}`);
        }
        
        // If we get here, the connection is working (even with no session)
        setStatus('connected');
      } catch (err) {
        setStatus('error');
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setErrorMessage(errorMsg);
        console.error('Supabase connection error:', err);
      }
    }

    if (supabaseUrl && supabaseKey) {
      testConnection();
    } else {
      setStatus('error');
      setErrorMessage('Missing environment variables');
    }
  }, []);

  return (
    <div className="p-4 rounded-lg border">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
      
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Environment Variables:</h3>
        <ul className="text-sm space-y-1">
          <li className={envStatus.url ? "text-green-600" : "text-red-600"}>
            VITE_SUPABASE_URL: {envStatus.url ? "✓ Present" : "✗ Missing"}
          </li>
          <li className={envStatus.key ? "text-green-600" : "text-red-600"}>
            VITE_SUPABASE_ANON_KEY: {envStatus.key ? "✓ Present" : "✗ Missing"}
          </li>
        </ul>
      </div>

      {status === 'loading' && (
        <p className="text-yellow-600">Testing connection...</p>
      )}
      {status === 'connected' && (
        <div>
          <p className="text-green-600">Successfully connected to Supabase!</p>
          <p className="text-sm text-gray-600 mt-1">Your connection is working properly.</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">Failed to connect to Supabase</p>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{errorMessage}</p>
        </div>
      )}
    </div>
  );
} 