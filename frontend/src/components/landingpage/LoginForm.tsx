'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"
import { Loader2 } from "lucide-react"

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
      const { user, error, isNewUser } = await signInWithEmail(email, password)
      if (error) setError(error.message)
      else if (user) {
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const redirectTo = urlParams.get('redirect')
        
        if (redirectTo && redirectTo.startsWith('/')) {
          router.push(redirectTo)
        } else {
          router.push(isNewUser ? '/categories' : '/home')
        }
      }
    } catch {
      setError('An error occurred during email sign-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Google Sign In */}
      <Button
        variant="outline"
        type="button"
        className="w-full h-11 border-[#E5E5E5] bg-white hover:bg-[#F5F5F4] text-[#1A1A1A] font-medium"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Image
            src="/google.png"
            alt="Google"
            width={18}
            height={18}
            className="mr-2"
          />
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E5E5E5]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-[#9CA3AF]">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-md">
          {error}
        </div>
      )}

      {/* Email Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">
              Password
            </Label>
            <a 
              href="#" 
              className="text-sm text-[#B45309] hover:text-[#92400E] transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-[#9CA3AF]">
        By continuing, you agree to our{" "}
        <a href="#" className="text-[#B45309] hover:underline">Terms of Service</a>
        {" "}and{" "}
        <a href="#" className="text-[#B45309] hover:underline">Privacy Policy</a>.
      </p>
    </div>
  )
}
