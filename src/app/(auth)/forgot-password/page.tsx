"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import MeshBackground from "@/components/layout/MeshBackground";
import GlassButton from "@/components/ui/GlassButton";

type Step = "email" | "code" | "password" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error sending code.");
      } else {
        setStep("code");
        setCountdown(60);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────
  async function handleResend() {
    if (countdown > 0) return;
    setError(null);
    setLoading(true);

    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCountdown(60);
      setOtp(["", "", "", "", "", "", "", ""]);
    } catch {
      setError("Error resending code.");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP Input Handler ─────────────────────────────────────
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return; // only digits

      const newOtp = [...otp];
      newOtp[index] = value.slice(-1); // single digit
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 7) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const newOtp = [...otp];
    for (let i = 0; i < 8; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? 7 : nextEmpty]?.focus();
  }

  // ── Step 2: Verify OTP server-side before advancing ────────
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const code = otp.join("");
    if (code.length !== 8) {
      setError("Please enter the full 8-digit code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code.");
        setOtp(["", "", "", "", "", "", "", ""]);
      } else {
        setStep("password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Set New Password (user already verified via OTP) ─
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.join(""),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error updating password.");
      } else {
        setStep("success");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step indicator ────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "code", label: "Code" },
    { key: "password", label: "Password" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // ── Animation variants ────────────────────────────────────
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  const direction = 1;

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
            {step === "success" ? (
              <CheckCircle2 size={28} className="text-white" />
            ) : (
              <KeyRound size={28} className="text-white" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {step === "success" ? "All Done!" : "Reset Password"}
          </h1>
          <p className="text-white/40 text-sm">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "code" && "Enter the 6-digit code sent to your email"}
            {step === "password" && "Set your new password"}
            {step === "success" && "Your password has been updated successfully"}
          </p>
        </div>

        {/* Step Indicator */}
        {step !== "success" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                    i <= currentStepIndex
                      ? "bg-gradient-to-br from-sky-300 to-purple-400 text-white"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                  animate={{
                    scale: i === currentStepIndex ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  {i < currentStepIndex ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    i + 1
                  )}
                </motion.div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 rounded-full transition-all duration-500 ${
                      i < currentStepIndex
                        ? "bg-gradient-to-r from-sky-300 to-purple-400"
                        : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Card */}
        <div
          className="glass-strong p-8 overflow-hidden"
          style={{ borderRadius: "var(--radius-organic-lg)" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Step: Email ──────────────────────────── */}
            {step === "email" && (
              <motion.form
                key="email"
                onSubmit={handleSendCode}
                className="space-y-5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
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
                      id="reset-email"
                      type="email"
                      className="glass-input glass-input-with-icon"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
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
                  Send Code
                  <ArrowRight size={16} />
                </GlassButton>
              </motion.form>
            )}

            {/* ── Step: Code ──────────────────────────── */}
            {step === "code" && (
              <motion.form
                key="code"
                onSubmit={handleVerifyCode}
                className="space-y-6"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* OTP Inputs */}
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-3 ml-1 text-center">
                    Verification Code
                  </label>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <motion.input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="glass-input w-11 h-14 text-center text-lg font-bold tracking-wider"
                        style={{
                          paddingLeft: 0,
                          paddingRight: 0,
                          caretColor: "#7dd3fc",
                        }}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Sent to email indicator */}
                <div className="text-center">
                  <p className="text-white/30 text-xs">
                    Code sent to{" "}
                    <span className="text-sky-300 font-medium">{email}</span>
                  </p>
                </div>

                {/* Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-white/25 text-xs">
                      Resend code in{" "}
                      <span className="text-purple-400 font-semibold">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sky-300 hover:text-sky-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
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

                <div className="flex gap-3">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setStep("email");
                      setError(null);
                    }}
                  >
                    <ArrowLeft size={16} />
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="flex-1"
                    disabled={otp.join("").length !== 8}
                  >
                    Verify
                    <ShieldCheck size={16} />
                  </GlassButton>
                </div>
              </motion.form>
            )}

            {/* ── Step: New Password ─────────────────── */}
            {step === "password" && (
              <motion.form
                key="password"
                onSubmit={handleSetPassword}
                className="space-y-5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                    />
                    <input
                      id="new-password"
                      type="password"
                      className="glass-input glass-input-with-icon"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                    />
                    <input
                      id="confirm-password"
                      type="password"
                      className="glass-input glass-input-with-icon"
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Password strength indicator */}
                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength =
                          (newPassword.length >= 6 ? 1 : 0) +
                          (/[A-Z]/.test(newPassword) ? 1 : 0) +
                          (/[0-9]/.test(newPassword) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                        const colors = [
                          "bg-red-400",
                          "bg-amber-400",
                          "bg-sky-400",
                          "bg-emerald-400",
                        ];
                        return (
                          <motion.div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= strength
                                ? colors[strength - 1]
                                : "bg-white/10"
                            }`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: level * 0.1 }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-white/25 text-[10px] ml-1">
                      Use uppercase, numbers and symbols for stronger security
                    </p>
                  </div>
                )}

                {error && (
                  <motion.div
                    className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setStep("code");
                      setError(null);
                    }}
                  >
                    <ArrowLeft size={16} />
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="flex-1"
                  >
                    Update Password
                    <ArrowRight size={16} />
                  </GlassButton>
                </div>
              </motion.form>
            )}

            {/* ── Step: Success ───────────────────────── */}
            {step === "success" && (
              <motion.div
                key="success"
                className="text-center space-y-6"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-400/20 border border-emerald-400/30 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    bounce: 0.5,
                    duration: 0.8,
                  }}
                >
                  <CheckCircle2 size={36} className="text-emerald-400" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Password Updated
                  </h2>
                  <p className="text-white/40 text-sm">
                    You can now sign in with your new password.
                  </p>
                </div>
                <GlassButton
                  size="lg"
                  className="w-full"
                  onClick={() => router.push("/login")}
                >
                  Go to Sign In
                  <ArrowRight size={16} />
                </GlassButton>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to login link */}
          {step !== "success" && (
            <div className="mt-6 text-center">
              <p className="text-white/30 text-xs">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-sky-300 hover:text-sky-200 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
