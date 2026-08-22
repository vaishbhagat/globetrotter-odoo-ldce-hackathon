import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    async function checkAdmin() {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session!.user.id)
        .single();
      
      if (error || !data) setIsAdmin(false);
      else setIsAdmin(data.is_admin);
    }
    
    checkAdmin();
  }, [session]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linen-100">
        <Loader2 size={32} className="animate-spin text-terracotta-500" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
