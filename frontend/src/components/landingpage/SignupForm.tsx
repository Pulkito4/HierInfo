"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"
import { useRouter } from "next/navigation"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
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
    // Clear error when user starts typing
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
        // Redirect to categories page for onboarding
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
  return (
    <Card {...props} className="max-w-3xl">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          {success 
            ? "Account created successfully! Redirecting..." 
            : "Enter your information below to create your account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            Account created successfully! Check your email to verify your account. Redirecting to setup...
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleInputChange}
                disabled={isLoading || success}
                required 
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading || success}
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input 
                id="password" 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading || success}
                required 
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input 
                id="confirm-password" 
                name="confirmPassword"
                type="password" 
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading || success}
                required 
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button 
                  type="submit" 
                  disabled={isLoading || success}
                  className="w-full"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading || success}
                  className="w-full"
                >
                  {isLoading ? "Signing up..." : "Sign up with Google"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
