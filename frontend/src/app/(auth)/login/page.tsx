import { LoginForm } from "@/components/landingpage/LoginForm";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Zap, Shield } from "lucide-react";

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
            // Ignore
          }
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  // Auto-redirect to home if already logged in
  if (session) {
    redirect('/home');
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#111936] via-[#0b1330] to-[#090f24]">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-coral/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-8">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <Image src="/logoicon.png" alt="HierInfo logo" width={48} height={48} className="w-12 h-12 object-contain" />
            <span className="text-2xl font-bold text-slate-100">HierInfo</span>
          </Link>

          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            News That Respects Your Time
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-md">
            Join thousands of readers who&apos;ve ditched the clutter. No duplicates, 
            no clickbait — just the stories that matter.
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-coral" />
              </div>
              <div>
                <p className="text-slate-100 font-medium">No More Repetition</p>
                <p className="text-slate-400 text-sm">One story, one time — we group duplicates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-gold-dark" />
              </div>
              <div>
                <p className="text-slate-100 font-medium">Quick Summaries</p>
                <p className="text-slate-400 text-sm">Get the gist in 30 seconds, not 30 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-slate-100 font-medium">Clickbait-Free</p>
                <p className="text-slate-400 text-sm">Headlines that deliver on their promise</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logoicon.png" alt="HierInfo logo" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-slate-100">HierInfo</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            {/* Back Link */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-coral transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                Welcome back
              </h1>
              <p className="text-slate-400">
                Sign in to continue reading your personalized news feed
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-slate-900/80 rounded-2xl p-8 shadow-xl border border-slate-700/60 backdrop-blur">
              <LoginForm />
            </div>

            {/* Sign Up Link */}
            <p className="text-center mt-6 text-slate-400">
              Don&apos;t have an account?{" "}
              <Link 
                href="/sign-up" 
                className="font-semibold text-coral hover:text-coral-dark transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
