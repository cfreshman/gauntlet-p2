import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SupabaseStatus } from '../components/ui/supabase-status';
import { Ticket, Users, Bot, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function Landing() {
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkFirstUser() {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      setIsFirstUser(!data);
    }
    checkFirstUser();
  }, []);

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 top-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl animate-drift-1" />
        <div className="absolute -left-1/4 -bottom-1/4 w-1/2 h-1/2 bg-primary/3 rounded-full blur-3xl animate-drift-2" />
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-16 relative">
        <div className="space-y-8 text-center max-w-[600px]">
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">
            auto-crm
          </h1>
          <p className="text-lg sm:text-xl text-primary/60 max-w-lg mx-auto">
            {isFirstUser ? 'organize your team and support customers' : 'need help? create a ticket below'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md relative">
          <div className="absolute -inset-4 bg-primary/5 blur-lg rounded-lg transition-opacity group-hover:opacity-75" />
          <Button asChild size="lg" className="w-full relative hover:scale-[1.02] transition-transform">
            <Link to={isFirstUser ? "/signup" : "/tickets/new"}>
              {isFirstUser ? 'create account' : 'create ticket'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative mt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10" />
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          <div className="p-8 space-y-4 text-center group">
            <div className="flex justify-center">
              <Ticket className="w-8 h-8 text-primary/60 group-hover:text-primary/90 transition-colors" />
            </div>
            <h3 className="text-lg font-medium group-hover:text-primary/90 transition-colors">
              tickets
            </h3>
            <div className="w-12 h-[1px] bg-primary/20 mx-auto group-hover:bg-primary/40 transition-colors" />
            <p className="text-sm text-primary/60">
              describe your issue
            </p>
          </div>
          <div className="p-8 space-y-4 text-center group">
            <div className="flex justify-center">
              <Users className="w-8 h-8 text-primary/60 group-hover:text-primary/90 transition-colors" />
            </div>
            <h3 className="text-lg font-medium group-hover:text-primary/90 transition-colors">
              support
            </h3>
            <div className="w-12 h-[1px] bg-primary/20 mx-auto group-hover:bg-primary/40 transition-colors" />
            <p className="text-sm text-primary/60">
              we'll help you out
            </p>
          </div>
          <div className="p-8 space-y-4 text-center group">
            <div className="flex justify-center">
              <Bot className="w-8 h-8 text-primary/60 group-hover:text-primary/90 transition-colors" />
            </div>
            <h3 className="text-lg font-medium group-hover:text-primary/90 transition-colors">
              AI
            </h3>
            <div className="w-12 h-[1px] bg-primary/20 mx-auto group-hover:bg-primary/40 transition-colors" />
            <p className="text-sm text-primary/60">
              quick responses
            </p>
          </div>
          <div className="p-8 space-y-4 text-center group">
            <div className="flex justify-center">
              <FileText className="w-8 h-8 text-primary/60 group-hover:text-primary/90 transition-colors" />
            </div>
            <h3 className="text-lg font-medium group-hover:text-primary/90 transition-colors">
              docs
            </h3>
            <div className="w-12 h-[1px] bg-primary/20 mx-auto group-hover:bg-primary/40 transition-colors" />
            <p className="text-sm text-primary/60">
              search for answers
            </p>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-4 flex justify-center border-t border-primary/10 relative backdrop-blur-sm">
        <SupabaseStatus />
      </div>
    </div>
  );
} 