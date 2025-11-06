'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if this is a code-based auth callback (OAuth or email confirmation)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          // Exchange code for session - this is automatic with @supabase/ssr
          // but we call getSession to trigger the exchange
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            router.push('/login?error=auth-failed');
            return;
          }

          if (!session?.user) {
            console.error('No session after code exchange');
            router.push('/login?error=no-session');
            return;
          }
          
          console.log('User authenticated via code exchange:', session.user.id);
        } else {
          // Direct session (e.g., password login)
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.user) {
            console.error('No valid session in callback');
            router.push('/login?error=no-session');
            return;
          }
          
          console.log('User authenticated via direct session:', session.user.id);
        }

        // Check for redirect parameter
        const redirectTo = urlParams.get('redirect');
        
        if (redirectTo && redirectTo.startsWith('/')) {
          router.push(redirectTo);
        } else {
          router.push('/home');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        router.push('/login?error=callback-failed');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#101130]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Completing sign in...</p>
      </div>
    </div>
  );
}