import { useAuth } from '../lib/hooks/useAuth';
import { SupabaseStatus } from '../components/ui/supabase-status';

export function Dashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h1 className="text-2xl font-medium">
        welcome back, {profile?.username}
      </h1>
      <p className="text-sm text-muted-foreground">
        your dashboard will go here
      </p>
      <SupabaseStatus />
    </div>
  );
} 