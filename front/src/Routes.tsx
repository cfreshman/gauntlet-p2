import { Navigate, Routes as RouterRoutes, Route } from 'react-router-dom';
import { useAuth } from './lib/hooks/useAuth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Settings } from './pages/Settings';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // or a loading spinner
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // or a loading spinner
  }
  
  if (user) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // or a loading spinner
  }
  
  return user ? <Dashboard /> : <Landing />;
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
    </RouterRoutes>
  );
} 