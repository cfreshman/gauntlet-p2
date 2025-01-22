import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

export function Header() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const isTicketList = location.pathname === '/tickets';

  return (
    <header className="bg-header border-b h-12 flex items-center px-4">
      <div className="flex-1 flex items-center">
        <Link to="/" className="text-lg font-semibold">
          auto-crm
        </Link>
        
        {profile && (
          <nav className="ml-8 space-x-4">
            <Link 
              to={isTicketList ? "/tickets?view=tickets" : "/tickets"}
              className="text-sm text-primary/70 hover:text-primary"
            >
              tickets
            </Link>
          </nav>
        )}
      </div>

      {profile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7 hover:text-background">
              <div className="flex items-center">
                <span>{profile.username}</span>
                {(profile.role === 'worker' || profile.role === 'manager') && (
                  <span className="ml-1 opacity-70">({profile.role})</span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/settings">settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="space-x-4">
          <Link to="/login" className="text-sm text-primary/70 hover:text-primary">
            sign in
          </Link>
          <Link to="/signup" className="text-sm text-primary/70 hover:text-primary">
            sign up
          </Link>
        </div>
      )}
    </header>
  );
} 