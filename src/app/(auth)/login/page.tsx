"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MeshBackground from "@/components/layout/MeshBackground";
import GlassButton from "@/components/ui/GlassButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-sky-300 to-purple-400 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          >
            <Sparkles size={28} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Welcome Back
          </h1>
          <p className="text-white/40 text-sm">
            Sign in to your KanBan AI workspace
          </p>
        </div>

        {/* Form */}
        <div className="glass-strong p-8" style={{ borderRadius: "var(--radius-organic-lg)" }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                />
                <input
                  id="login-email"
                  type="email"
                  className="glass-input glass-input-with-icon"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                />
                <input
                  id="login-password"
                  type="password"
                  className="glass-input glass-input-with-icon"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                href="/forgot-password"
                className="text-sky-300/70 hover:text-sky-200 text-xs transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <motion.div
                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <GlassButton
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign In
              <ArrowRight size={16} />
            </GlassButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-sky-300 hover:text-sky-200 transition-colors font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
