"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestAuth() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    // Simple way to display cookies for debugging
    setCookies(document.cookie);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Session Status</h2>
        <p className="mb-2">
          <span className="font-medium">Current status:</span>{" "}
          <span 
            className={`px-2 py-1 rounded text-sm ${
              status === "authenticated" 
                ? "bg-green-100 text-green-800" 
                : status === "loading" 
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        </p>
      </div>
      
      {session && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Cookie Information</h2>
        <div className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
          {cookies ? cookies.split(';').map((cookie, index) => (
            <div key={index} className="mb-1">{cookie.trim()}</div>
          )) : "No cookies found"}
        </div>
      </div>
      
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button>Try Dashboard</Button>
        </Link>
        <Link href="/auth/signin">
          <Button variant="outline">Go to Sign In</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go to Home</Button>
        </Link>
      </div>
    </div>
  );
} 