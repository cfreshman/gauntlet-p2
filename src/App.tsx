import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/hooks/useAuth';
import { Header } from './components/Header';
import { Routes } from './Routes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes />
      </BrowserRouter>
    </AuthProvider>
  );
}
