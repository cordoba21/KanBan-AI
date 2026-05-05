"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Terminal, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MeshBackground from "@/components/layout/MeshBackground";
import GlassButton from "@/components/ui/GlassButton";
import { useTheme } from "@/lib/theme/ThemeContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/kanban");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <MeshBackground />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded bg-[#00FF41]/10 border border-[#00FF41]/15 flex items-center justify-center text-[#00FF41]/50 hover:text-[#00FF41] transition-colors"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-14 h-14 mx-auto mb-5 rounded bg-[#00FF41]/10 border border-[#00FF41]/30 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
          >
            <Terminal size={24} className="text-[#00FF41]" />
          </motion.div>
          <h1 className="text-2xl font-bold gradient-text mb-2 font-mono">
            $ useradd --create
          </h1>
          <p className="text-[#c8c8c8]/40 text-xs font-mono">
            register new kanban-ai session
          </p>
        </div>

        {/* Form */}
        <div className="glass-strong p-7" style={{ borderRadius: "var(--radius-organic-lg)" }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#00FF41]/40 mb-2 uppercase tracking-wider">
                full_name
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00FF41]/30 glass-input-icon"
                />
                <input
                  id="register-name"
                  type="text"
                  className="glass-input glass-input-with-icon"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#00FF41]/40 mb-2 uppercase tracking-wider">
                email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00FF41]/30 glass-input-icon"
                />
                <input
                  id="register-email"
                  type="email"
                  className="glass-input glass-input-with-icon"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#00FF41]/40 mb-2 uppercase tracking-wider">
                password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00FF41]/30 glass-input-icon"
                />
                <input
                  id="register-password"
                  type="password"
                  className="glass-input glass-input-with-icon"
                  placeholder="min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <motion.div
                className="text-[#FF3B3B] text-[11px] bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 p-3 font-mono"
                style={{ borderRadius: "var(--radius-organic-sm)" }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-[#FF3B3B]/60">[ERR]</span> {error}
              </motion.div>
            )}

            <GlassButton
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              create account
              <ArrowRight size={14} />
            </GlassButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#c8c8c8]/30 text-[11px] font-mono">
              existing user?{" "}
              <Link
                href="/login"
                className="text-[#00FF41]/70 hover:text-[#00FF41] transition-colors font-semibold"
              >
                ssh login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
