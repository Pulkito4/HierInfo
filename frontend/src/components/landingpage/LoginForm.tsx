'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"
import { Loader2, Mail, Lock } from "lucide-react"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch {
      setError('An error occurred during Google sign-in')
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      const { user, error } = await signInWithEmail(email, password)
      if (error) setError(error.message)
      else if (user) {
        router.push('/home')
      }
    } catch {
      setError('An error occurred during email sign-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-5", className)} {...props}>
      {/* Google Sign In */}
      <Button
        variant="outline"
        type="button"
        className="w-full h-12 bg-white border-slate-200 hover:bg-slate-50 hover:border-coral/50 text-slate-700 font-medium rounded-xl transition-all"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Image
            src="/google.png"
            alt="Google"
            width={20}
            height={20}
            className="mr-2"
          />
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Email Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <a 
              href="#" 
              className="text-sm text-coral hover:text-coral-dark transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 pl-10 bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white font-semibold rounded-xl transition-all shadow-lg shadow-coral/25"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-400">
        By continuing, you agree to our{" "}
        <a href="#" className="text-coral hover:text-coral-dark">Terms</a>
        {" "}and{" "}
        <a href="#" className="text-coral hover:text-coral-dark">Privacy Policy</a>.
      </p>
    </div>
  )
}
