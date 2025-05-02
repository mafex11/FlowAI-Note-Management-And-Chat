"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SessionFix() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isFixing, setIsFixing] = useState(false);
  
  const forceNavigation = () => {
    setIsFixing(true);
    router.push("/dashboard");
    router.refresh();
    setTimeout(() => setIsFixing(false), 2000);
  };
  
  const forceSessionUpdate = async () => {
    setIsFixing(true);
    await update(); // Force the session to update
    router.refresh();
    setTimeout(() => setIsFixing(false), 2000);
  };
  
  if (status !== "authenticated") {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-md z-50 max-w-md">
      <h3 className="text-sm font-medium mb-2">Session Troubleshooter</h3>
      <p className="text-xs text-gray-500 mb-3">
        If you're seeing this, you're authenticated but might be experiencing navigation issues.
      </p>
      <div className="flex flex-col gap-2">
        <Button 
          size="sm" 
          onClick={forceNavigation}
          disabled={isFixing}
        >
          {isFixing ? "Fixing..." : "Force Dashboard Navigation"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={forceSessionUpdate}
          disabled={isFixing}
        >
          {isFixing ? "Updating..." : "Force Session Update"}
        </Button>
      </div>
    </div>
  );
} 