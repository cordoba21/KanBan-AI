"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MeshBackground from "@/components/layout/MeshBackground";
import GlassButton from "@/components/ui/GlassButton";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-400 to-sky-300 flex items-center justify-center"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          >
            <Sparkles size={28} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Create Account
          </h1>
          <p className="text-white/40 text-sm">
            Join the KanBan AI workspace
          </p>
        </div>

        {/* Form */}
        <div className="glass-strong p-8" style={{ borderRadius: "var(--radius-organic-lg)" }}>
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
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
              <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                />
                <input
                  id="register-email"
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
                  id="register-password"
                  type="password"
                  className="glass-input glass-input-with-icon"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
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
              Create Account
              <ArrowRight size={16} />
            </GlassButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
