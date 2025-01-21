import { useState } from 'react';
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
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const isTicketList = location.pathname === '/tickets';

  return (
    <header className="bg-[#d0d5d6] border-b h-12 flex items-center px-4">
      <div className="flex-1 flex items-center">
        <Link to="/" className="text-lg font-semibold">
          auto-crm
        </Link>
        
        {profile && (
          <nav className="ml-8 space-x-4">
            <Link 
              to={isTicketList ? "/tickets?view=tickets" : "/tickets"}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              tickets
            </Link>
          </nav>
        )}
      </div>

      {profile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-7">
              {profile.username}
              {(profile.role === 'worker' || profile.role === 'manager') && (
                <span className="ml-1 text-gray-500">({profile.role})</span>
              )}
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
          <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
            sign in
          </Link>
          <Link to="/signup" className="text-sm text-gray-600 hover:text-gray-900">
            sign up
          </Link>
        </div>
      )}
    </header>
  );
} 