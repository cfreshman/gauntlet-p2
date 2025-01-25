import { Link } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell'

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="relative h-12 bg-header border-b border-primary/20 dithered">
      <div className="noise-texture absolute inset-0" />
      <div className="relative h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium">
            auto-crm
          </Link>
          
          {profile && (
            <>
              <Link 
                to="/tickets" 
                className="text-sm text-primary/70 hover:text-primary"
              >
                tickets
              </Link>
              {(profile.role === 'worker' || profile.role === 'manager') && (
                <>
                  <Link 
                    to="/kb" 
                    className="text-sm text-primary/70 hover:text-primary"
                  >
                    knowledge base
                  </Link>
                  <Link 
                    to="/help" 
                    className="text-sm text-primary/70 hover:text-primary"
                  >
                    help center
                  </Link>
                </>
              )}
              {profile.role === 'customer' && (
                <Link 
                  to="/help" 
                  className="text-sm text-primary/70 hover:text-primary"
                >
                  help center
                </Link>
              )}
            </>
          )}
        </div>

        {profile ? (
          <div className="flex items-center gap-2">
            <NotificationBell />
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
          </div>
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
      </div>
    </header>
  );
} 