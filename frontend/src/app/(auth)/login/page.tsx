import { LoginForm } from "@/components/landingpage/LoginForm";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Newspaper, ArrowLeft } from "lucide-react";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  // If a session exists, redirect to home page
  if (session) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-md flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">
              HierInfo
            </span>
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">
              Welcome back
            </h1>
            <p className="text-[#6B6B6B]">
              Sign in to continue your personalized news experience
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-8">
            <LoginForm />
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-sm text-[#6B6B6B]">
            Don&apos;t have an account?{" "}
            <Link 
              href="/sign-up" 
              className="font-medium text-[#B45309] hover:text-[#92400E] transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-6 border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#6B6B6B]">
          <p>© 2025 HierInfo. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</Link>
            <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-[#1A1A1A] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
