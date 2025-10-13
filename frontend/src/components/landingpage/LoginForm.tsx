'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
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
import { signInWithEmail, signInWithGoogle } from "@/lib/supabaseAuth"

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
      else if (user) router.push(isNewUser ? '/categories' : '/home')
    } catch {
      setError('An error occurred during email sign-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 max-w-md mx-auto", className)} {...props}>
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-semibold">Welcome to HeirInfo </CardTitle>
          <CardDescription className="text-gray-500">
            Sign in to continue your personalized news journey
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            variant="outline"
            type="button"
            className="relative flex w-full items-center justify-center gap-2 border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img
              src="/google.png"
              alt="Google"
              className="w-4 h-4 absolute left-3"
            />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="flex items-center justify-center text-gray-400 text-sm">
            <hr className="w-1/4 border-gray-300" />
            <span className="px-3 text-gray-500">or continue with email</span>
            <hr className="w-1/4 border-gray-300" />
          </div>

          {error && (
            <div className="text-center text-red-500 text-sm bg-red-50 py-2 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </Field>

              <Button
                type="submit"
                className="w-full bg-[#1E2A44] hover:bg-blue-800 text-white transition-colors"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <FieldDescription className="text-center text-sm text-gray-500">
                Don’t have an account?{" "}
                <a href="/sign-up" className="text-blue-600 hover:underline">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs text-gray-500">
        By continuing, you agree to our{" "}
        <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{" "}
        <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
