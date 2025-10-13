'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleAuthCallback } from '@/lib/supabaseAuth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { user, error, isNewUser } = await handleAuthCallback();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/sign-in?error=auth-failed');
          return;
        }

        if (!user) {
          console.error('No user returned from callback');
          router.push('/sign-in?error=no-user');
          return;
        }

        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        // Redirect based on user status
        console.log('User authenticated:', { user: user.id, isNewUser });
        if (isNewUser) {
          router.push('/categories');
        } else if (redirectTo && redirectTo.startsWith('/')) {
          router.push(redirectTo);
        } else {
          router.push('/home');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        router.push('/sign-in?error=callback-failed');
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