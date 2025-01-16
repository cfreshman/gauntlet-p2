import { SupabaseTest } from './components/SupabaseTest';
import './styles/index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-center">
          React + Supabase + LangChain Project
        </h1>
        <SupabaseTest />
      </div>
    </div>
  );
}

export default App;
