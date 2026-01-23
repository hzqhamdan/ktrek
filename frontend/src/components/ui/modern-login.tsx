import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
} from "lucide-react";
import { motion, useInView, type Variants } from "framer-motion";

// Gradient Background Component (same vibe as Register)
const GradientBackground = () => (
  <>
    <style>
      {`@keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } } @keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } }`}
    </style>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="absolute top-0 left-0 w-full h-full"
    >
      <defs>
        <linearGradient id="rev_grad1_login" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--primary))", stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-3))", stopOpacity: 0.35 }} />
        </linearGradient>
        <linearGradient id="rev_grad2_login" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--chart-4))", stopOpacity: 0.45 }} />
          <stop offset="50%" style={{ stopColor: "rgb(var(--secondary))", stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-1))", stopOpacity: 0.4 }} />
        </linearGradient>
        <radialGradient id="rev_grad3_login" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--destructive))", stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-5))", stopOpacity: 0.18 }} />
        </radialGradient>
        <filter id="rev_blur1_login" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter id="rev_blur2_login" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter id="rev_blur3_login" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <g style={{ animation: "float1 20s ease-in-out infinite" }}>
        <ellipse
          cx="200"
          cy="500"
          rx="250"
          ry="180"
          fill="url(#rev_grad1_login)"
          filter="url(#rev_blur1_login)"
          transform="rotate(-30 200 500)"
        />
        <rect
          x="500"
          y="100"
          width="300"
          height="250"
          rx="80"
          fill="url(#rev_grad2_login)"
          filter="url(#rev_blur2_login)"
          transform="rotate(15 650 225)"
        />
      </g>
      <g style={{ animation: "float2 25s ease-in-out infinite" }}>
        <circle
          cx="650"
          cy="450"
          r="150"
          fill="url(#rev_grad3_login)"
          filter="url(#rev_blur3_login)"
          opacity="0.7"
        />
        <ellipse
          cx="50"
          cy="150"
          rx="180"
          ry="120"
          fill="rgb(var(--accent))"
          filter="url(#rev_blur2_login)"
          opacity="0.35"
        />
      </g>
    </svg>
  </>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-5 h-5">
    <g fillRule="evenodd" fill="none">
      <g fillRule="nonzero" transform="translate(3, 2)">
        <path
          fill="#4285F4"
          d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"
        />
        <path
          fill="#34A853"
          d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"
        />
        <path
          fill="#FBBC05"
          d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"
        />
        <path
          fill="#EB4335"
          d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"
        />
      </g>
    </g>
  </svg>
);

// --- Simple BlurFade animation (same vibe as Register) ---
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  yOffset = 6,
  blur = "6px",
}: BlurFadeProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const variants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: 0, opacity: 1, filter: "blur(0px)" },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ModernLoginProps {
  logo?: React.ReactNode;
  brandName?: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onRequestPasswordReset?: (email: string) => void;
  onGoogleSignIn?: () => void;
}

export const ModernLogin = ({
  logo,
  brandName = "K-Trek",
  onLogin,
  onRequestPasswordReset,
  onGoogleSignIn,
}: ModernLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEmailValid || !password) {
      setError("Please enter a valid email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen w-screen flex flex-col">
      {/* Left: logo (if provided) */}
      <button
        type="button"
        onClick={() => navigate(user ? "/dashboard" : "/")}
        className={cn("auth-plain-btn fixed top-4 left-4 z-20 flex items-center gap-3")}
        style={{ background: "transparent", padding: 0, border: 0 }}
      >
        {logo ? logo : null}
      </button>

      {/* Center: brand name only */}
      <button
        type="button"
        onClick={() => navigate(user ? "/dashboard" : "/")}
        className={cn("auth-plain-btn fixed top-4 left-1/2 -translate-x-1/2 z-20")}
        style={{ background: "transparent", padding: 0, border: 0 }}
      >
        <span
          className="text-2xl font-semibold"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: "#000" }}
        >
          {brandName}
        </span>
      </button>

      <div className={cn("flex w-full flex-1 h-full items-center justify-center bg-[rgb(var(--secondary))]", "relative overflow-hidden")}>
        <div className="absolute inset-0 z-0">
          <GradientBackground />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md px-4 relative z-10"
        >
          <BlurFade delay={0.25 * 1} className="text-center mb-8">
            <h2 className="font-serif font-light text-5xl tracking-tight text-foreground mb-3">Welcome Back</h2>
            <p className="text-sm font-medium text-muted-foreground">Sign in to continue your adventure</p>
          </BlurFade>

          {onGoogleSignIn && (
            <BlurFade delay={0.25 * 2} className="flex flex-col items-center gap-3 mb-6">
              <p className="text-sm font-medium text-muted-foreground">Continue with</p>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="auth-plain-btn w-full rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-4 py-3 flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground hover:bg-white/5 transition"
              >
                <GoogleIcon />
                <span className="font-semibold">Google</span>
              </button>
              <div className="flex items-center w-full gap-2 py-2">
                <hr className="w-full border-border" />
                <span className="text-xs font-semibold text-muted-foreground">OR</span>
                <hr className="w-full border-border" />
              </div>
            </BlurFade>
          )}

          <BlurFade delay={0.25 * 3}>
            <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="flex items-center rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-4 py-3 gap-3">
                <Mail className="h-5 w-5 text-foreground/70 shrink-0" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-auth-input flex-1 bg-transparent text-foreground placeholder:text-foreground/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="flex items-center rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-4 py-3 gap-3">
                <Lock className="h-5 w-5 text-foreground/70 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-auth-input flex-1 bg-transparent text-foreground placeholder:text-foreground/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="auth-plain-btn h-9 w-9 rounded-full bg-transparent hover:bg-white/5 transition flex items-center justify-center text-foreground/60 hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {onRequestPasswordReset && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onRequestPasswordReset(email)}
                  className="auth-plain-btn text-sm text-foreground/40 hover:text-foreground/80 transition-colors bg-transparent backdrop-blur-sm px-3 py-1 rounded-full"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="auth-plain-btn w-full rounded-full bg-transparent backdrop-blur-sm border border-white/20 px-6 py-3.5 flex items-center justify-center gap-2 text-foreground/70 hover:text-foreground hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Don't have an account? link (below Sign In button) */}
            <div className="text-center">
              <p className="text-sm text-foreground/70">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold hover:text-foreground transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
            </form>
          </BlurFade>
        </motion.div>
      </div>
    </div>
  );
};
