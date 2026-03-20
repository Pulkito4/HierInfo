'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Newspaper } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
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
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.user) {
            console.error('No valid session in callback');
            router.push('/login?error=no-session');
            return;
          }
          
          console.log('User authenticated via direct session:', session.user.id);
        }

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
    <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7]">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#1A1A1A] rounded-xl flex items-center justify-center mx-auto mb-6">
          <Newspaper className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#B45309]" />
          <p className="text-[#1A1A1A] font-medium">Completing sign in...</p>
        </div>
        <p className="text-sm text-[#9CA3AF]">Please wait while we authenticate you</p>
      </div>
    </div>
  );
}
