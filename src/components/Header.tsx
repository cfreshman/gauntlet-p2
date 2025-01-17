import { Link } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="h-12 border-b">
      <div className="flex h-full items-center justify-between px-4">
        <Link to="/" className="text-sm font-medium">
          gauntlet-starter
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 bg-secondary"
                >
                  {profile?.username}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem asChild>
                  <Link to="/settings">settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link to="/login">sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 