import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SupabaseStatus } from '../components/ui/supabase-status';

export function Landing() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-medium">welcome to auto-crm</h1>
      <p className="text-sm text-muted-foreground">
        modern customer support system
      </p>
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/signup">sign up</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/login">sign in</Link>
        </Button>
      </div>
      <SupabaseStatus />
    </div>
  );
} 