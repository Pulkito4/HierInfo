'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

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
          
          // Auto-redirect to categories for new users, home for existing
          // For now, redirect to home - the categories page will check if needed
          router.push('/home');
        } else {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.user) {
            console.error('No valid session in callback');
            router.push('/login?error=no-session');
            return;
          }
          
          console.log('User authenticated via direct session:', session.user.id);
          
          // Auto-redirect to home
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
    <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
      <div className="text-center">
        <Image src="/logoicon.png" alt="HierInfo logo" width={80} height={80} className="w-20 h-20 object-contain mx-auto mb-6" />
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-white font-semibold text-lg">Completing sign in...</p>
        </div>
        <p className="text-slate-400">Redirecting you to your feed</p>
      </div>
    </div>
  );
}
