import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/hooks/useAuth';
import { ThemeProvider } from './lib/hooks/useTheme';
import { Header } from './components/Header';
import { Routes } from './Routes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Header />
          <Routes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
