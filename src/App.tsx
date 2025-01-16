import { SupabaseTest } from './components/SupabaseTest';
import './styles/index.css';

function App() {
  const isDev = import.meta.env.MODE === 'development';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            React + Supabase + LangChain Project
          </h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isDev 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-green-100 text-green-800 border border-green-300'
          }`}>
            {isDev ? 'Development' : 'Production'}
          </div>
        </div>
        <SupabaseTest />
      </div>
    </div>
  );
}

export default App;
