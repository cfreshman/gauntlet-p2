import { Navigate, Routes as RouterRoutes, Route, useNavigate } from 'react-router-dom';
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
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
    return null; // or a loading spinner
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
      <Route path="/login" element={
        <RequireGuest>
          <Login />
        </RequireGuest>
      } />
      <Route path="/signup" element={
        <RequireGuest>
          <Signup />
        </RequireGuest>
      } />
      <Route path="/settings" element={
        <RequireAuth>
          <Settings />
        </RequireAuth>
      } />
      <Route path="/reset-password" element={
        <RequireGuest>
          <ResetPassword />
        </RequireGuest>
      } />
      <Route path="/update-password" element={
        <RequireAuth>
          <UpdatePassword />
        </RequireAuth>
      } />
      <Route path="/tickets" element={
        <RequireAuth>
          <TicketList />
        </RequireAuth>
      } />
      <Route path="/tickets/new" element={
        <RequireAuth>
          <TicketCreate />
        </RequireAuth>
      } />
      <Route path="/tickets/:id" element={
        <RequireAuth>
          <TicketDetail />
        </RequireAuth>
      } />
      <Route path="/logout" element={
        <RequireAuth>
          <Logout />
        </RequireAuth>
      } />
    </RouterRoutes>
  );
} 