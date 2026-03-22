"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, CheckCircle, User, Mail, Lock } from "lucide-react"

export function SignupForm({ ...props }: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const shouldBypassAuth =
    typeof window !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' || process.env.NODE_ENV !== 'production') &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (shouldBypassAuth) {
      router.push('/home')
      return
    }
    
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const { user, error: signUpError } = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.name
      )

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
        return
      }

      if (user) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/categories')
        }, 1500)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (shouldBypassAuth) {
      router.push('/home')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const { error: googleError } = await signInWithGoogle()
      
      if (googleError) {
        setError(googleError.message || 'Failed to sign up with Google')
      }
    } catch (err) {
      setError('An unexpected error occurred with Google signup')
      console.error('Google signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-teal" />
        </div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Account created!
        </h3>
        <p className="text-slate-400">
          Taking you to customize your feed...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5" {...props}>
      {/* Google Sign Up */}
      <Button
        variant="outline"
        type="button"
        className="w-full h-12 bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-coral/60 text-slate-100 font-medium rounded-xl transition-all"
        onClick={handleGoogleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
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
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-slate-500">
            Or sign up with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-300">
            Full name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="h-12 pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="h-12 pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="h-12 pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
          <p className="text-xs text-slate-500">
            Must be at least 8 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="h-12 pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl focus:border-coral focus:ring-coral/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-coral to-coral-light hover:from-coral-dark hover:to-coral text-white font-semibold rounded-xl transition-all shadow-lg shadow-coral/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-coral hover:text-coral-dark">Terms</a>
        {" "}and{" "}
        <a href="#" className="text-coral hover:text-coral-dark">Privacy Policy</a>.
      </p>
    </div>
  )
}
