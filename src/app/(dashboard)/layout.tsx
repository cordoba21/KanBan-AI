"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MeshBackground from "@/components/layout/MeshBackground";
import { createClient } from "@/lib/supabase/client";

const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), {
  ssr: false,
});

const ChatBot = dynamic(() => import("@/components/ai/ChatBot"), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated — redirect to login
        router.replace("/login");
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    }

    checkAuth();
  }, [router]);

  // Show loading spinner while checking auth
  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050510]">
        <MeshBackground />
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#7dd3fc] border-r-[#c084fc] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative">
      <MeshBackground />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
      <ChatBot />
    </div>
  );
}
