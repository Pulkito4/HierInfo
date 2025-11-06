'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Exchange the code for a session (PKCE flow)
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth-failed');
          return;
        }

        if (!data.user) {
          console.error('No user returned from callback');
          router.push('/login?error=no-user');
          return;
        }

        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        console.log('User authenticated:', data.user.id);
        
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