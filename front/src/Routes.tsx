import { Navigate, Routes as RouterRoutes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/hooks/useAuth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ResetPassword } from './pages/ResetPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { TicketList } from './components/tickets/TicketList';
import { TicketCreate } from './components/tickets/TicketCreate';
import { TicketDetail } from './components/tickets/TicketDetail';
import { Logout } from './pages/Logout';
import { useEffect } from 'react';
import KnowledgeBase from './pages/kb';
import Help from './pages/help';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass the current location to redirect back after login
    return <Navigate to="/signup" state={{ from: location }} />;
  }

  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return null;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-[calc(100vh-12rem)] text-primary/70">
          loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  // Show role-specific dashboard for authenticated users
  return <Dashboard />;
}

export function Routes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/help/:id" element={<Help />} />
      <Route path="/help" element={<Help />} />
      
      {/* Guest routes */}
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
      <Route path="/reset-password" element={<RequireGuest><ResetPassword /></RequireGuest>} />
      <Route path="/update-password" element={<RequireGuest><UpdatePassword /></RequireGuest>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/settings/*" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/tickets" element={<RequireAuth><TicketList /></RequireAuth>} />
      <Route path="/tickets/new" element={<RequireAuth><TicketCreate /></RequireAuth>} />
      <Route path="/tickets/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
      <Route path="/kb/*" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/:id/edit" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/kb/new" element={<RequireAuth><KnowledgeBase /></RequireAuth>} />
      <Route path="/logout" element={<Logout />} />
    </RouterRoutes>
  );
} 