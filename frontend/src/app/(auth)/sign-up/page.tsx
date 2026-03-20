import { SignupForm } from "@/components/landingpage/SignupForm";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Newspaper, ArrowLeft, Heart, Clock, Globe, Star } from "lucide-react";

export default async function Signup() {
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
    <div className="min-h-screen bg-[#FFFBF5] flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal/10 via-coral/5 to-cream">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-teal/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-coral/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-8">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center shadow-lg shadow-coral/30">
              <Newspaper className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">HierInfo</span>
          </Link>

          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Start Your News Journey
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-md">
            Join thousands of readers who&apos;ve reclaimed their time. No more 
            doom-scrolling through the same stories.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <Heart className="w-6 h-6 text-coral mb-2" />
              <p className="text-lg font-bold text-slate-800 mb-1">For You</p>
              <p className="text-slate-500 text-sm">Stories tailored to your interests</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <Clock className="w-6 h-6 text-teal mb-2" />
              <p className="text-lg font-bold text-slate-800 mb-1">Save Time</p>
              <p className="text-slate-500 text-sm">5 minutes to stay informed</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <Globe className="w-6 h-6 text-gold-dark mb-2" />
              <p className="text-lg font-bold text-slate-800 mb-1">Stay Current</p>
              <p className="text-slate-500 text-sm">Updates every few minutes</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm">
              <Star className="w-6 h-6 text-indigo-500 mb-2" />
              <p className="text-lg font-bold text-slate-800 mb-1">Quality First</p>
              <p className="text-slate-500 text-sm">No clickbait, ever</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-coral-light flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">HierInfo</span>
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            {/* Back Link */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-coral transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Create your account
              </h1>
              <p className="text-slate-500">
                Start reading smarter, not harder
              </p>
            </div>

            {/* Signup Form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
              <SignupForm />
            </div>

            {/* Login Link */}
            <p className="text-center mt-6 text-slate-500">
              Already have an account?{" "}
              <Link 
                href="/login" 
                className="font-semibold text-coral hover:text-coral-dark transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
