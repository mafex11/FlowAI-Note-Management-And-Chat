"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Import the SessionFix component dynamically to avoid SSR issues
const SessionFix = dynamic(() => import("@/app/dashboard/session-fix"), { ssr: false });

export default function SignIn() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('User is authenticated, redirecting to dashboard');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      console.log('Attempting sign in with email:', email);
      
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      console.log('Sign in result:', result);
      setDebugInfo(JSON.stringify(result, null, 2));

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        console.log('Sign in successful, redirecting to dashboard');
        // Force a small delay to ensure session is properly set
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError("An unexpected error occurred. Please try again.");
      setDebugInfo(JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Notes<span className="text-primary">AI</span>
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Auth Status: {status}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-2">
              <div className="text-sm text-red-500">{error}</div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>

        {status === 'authenticated' && (
          <div className="mt-4">
            <Button
              onClick={handleManualRedirect}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Dashboard Manually
            </Button>
            <p className="mt-2 text-xs text-center text-gray-500">
              You appear to be signed in already. Click the button above if you're not redirected automatically.
            </p>
          </div>
        )}

        <div className="mt-4 text-center text-sm">
          <p>
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
        
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-32">
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
      
      {/* Troubleshooter */}
      {status === 'authenticated' && <SessionFix />}
    </div>
  );
} 