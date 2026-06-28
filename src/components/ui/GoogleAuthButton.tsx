import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar } from 'lucide-react';

export default function GoogleAuthButton() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        redirectTo: window.location.origin
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (session && session.provider_token) {
    return (
      <button 
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-50 bg-cyan-900/40 border border-cyan-500/30 rounded-lg hover:bg-cyan-800/60 transition-colors"
      >
        <Calendar size={14} className="text-cyan-400" />
        Calendar Connected
      </button>
    );
  }

  return (
    <button 
      onClick={handleSignIn}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-50 bg-orange-600/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/40 transition-colors"
    >
      <Calendar size={14} className="text-orange-400" />
      Sync Google Calendar
    </button>
  );
}
