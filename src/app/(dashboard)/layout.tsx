"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#A78BFA] border-r-[#2DD4BF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative">
      <MeshBackground />

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl glass flex items-center justify-center text-white/70 hover:text-white transition-colors"
        style={{ border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, shown in drawer when open */}
      <div
        className={`
          fixed lg:relative z-[95] h-screen
          transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>
      <ChatBot />
    </div>
  );
}
