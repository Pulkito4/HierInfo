"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, CheckCircle } from "lucide-react"

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
      setError('Password must be at least 8 characters long')
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
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
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
        <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#059669]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Account created!
        </h3>
        <p className="text-[#6B6B6B]">
          Redirecting you to customize your news preferences...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6" {...props}>
      {/* Google Sign Up */}
      <Button
        variant="outline"
        type="button"
        className="w-full h-11 border-[#E5E5E5] bg-white hover:bg-[#F5F5F4] text-[#1A1A1A] font-medium"
        onClick={handleGoogleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
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
            Or sign up with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-md">
          {error}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-[#1A1A1A]">
            Full name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
          <p className="text-xs text-[#9CA3AF]">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A1A]">
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            className="h-11 border-[#E5E5E5] focus:border-[#B45309] focus:ring-[#B45309]"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-[#9CA3AF]">
        By creating an account, you agree to our{" "}
        <a href="#" className="text-[#B45309] hover:underline">Terms of Service</a>
        {" "}and{" "}
        <a href="#" className="text-[#B45309] hover:underline">Privacy Policy</a>.
      </p>
    </div>
  )
}
