import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Shuffle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api from "../../api";

// This component intentionally mirrors the styling/animation from `components/ui/sign-up.tsx`
// to keep onboarding consistent with the Register page.

type AvatarStyle = "micah" | "adventurer" | "notionists";

function dicebearUrl(style: AvatarStyle, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function randomSeed() {
  // Use crypto when available for better randomness.
  // Fallback keeps it working in older environments.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
        <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--primary))", stopOpacity: 0.55 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-3))", stopOpacity: 0.35 }} />
        </linearGradient>
        <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--chart-4))", stopOpacity: 0.45 }} />
          <stop offset="50%" style={{ stopColor: "rgb(var(--secondary))", stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-1))", stopOpacity: 0.4 }} />
        </linearGradient>
        <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "rgb(var(--destructive))", stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: "rgb(var(--chart-5))", stopOpacity: 0.18 }} />
        </radialGradient>
        <filter id="rev_blur1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
        <filter id="rev_blur2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <filter id="rev_blur3" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <g style={{ animation: "float1 20s ease-in-out infinite" }}>
        <ellipse
          cx="200"
          cy="500"
          rx="250"
          ry="180"
          fill="url(#rev_grad1)"
          filter="url(#rev_blur1)"
          transform="rotate(-30 200 500)"
        />
        <rect
          x="500"
          y="100"
          width="300"
          height="250"
          rx="80"
          fill="url(#rev_grad2)"
          filter="url(#rev_blur2)"
          transform="rotate(15 650 225)"
        />
      </g>
      <g style={{ animation: "float2 25s ease-in-out infinite" }}>
        <circle
          cx="650"
          cy="450"
          r="150"
          fill="url(#rev_grad3)"
          filter="url(#rev_blur3)"
          opacity="0.7"
        />
        <ellipse
          cx="50"
          cy="150"
          rx="180"
          ry="120"
          fill="rgb(var(--accent))"
          filter="url(#rev_blur2)"
          opacity="0.55"
        />
      </g>
    </svg>
  </>
);

const BlurFade: React.FC<{ children: React.ReactNode; className?: string; delay?: number }>=({ children, className, delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut", delay }}
  >
    {children}
  </motion.div>
);

const GlassButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { contentClassName?: string }>=({ className, contentClassName, children, ...props }) => (
  <button
    {...props}
    className={cn(
      "glass-button glass-soft w-full rounded-full px-6 py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed",
      className
    )}
  >
    <span className={cn("glass-button-text flex items-center justify-center gap-2", contentClassName)}>{children}</span>
  </button>
);

export const AvatarOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const params = new URLSearchParams(location.search);
  const redirectParam = params.get("redirect");
  const redirectTo = redirectParam && redirectParam.startsWith("/") && !redirectParam.includes("://")
    ? redirectParam
    : "/dashboard";
  const updateUser = useAuthStore((s) => s.updateUser);

  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<{ style: AvatarStyle; seed: string } | null>(null);

  const options = useMemo(() => {
    // 4 seeds × 3 styles = 12 avatars (nice 3×4 grid)
    const seeds = Array.from({ length: 4 }, () => randomSeed());
    const mixed: { style: AvatarStyle; seed: string }[] = [];
    for (const seed of seeds) {
      mixed.push({ style: "micah", seed });
      mixed.push({ style: "adventurer", seed });
      mixed.push({ style: "notionists", seed });
    }
    // Shuffle
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    return mixed;
  }, []);

  const [grid, setGrid] = useState(options);

  const reshuffle = () => {
    const seeds = Array.from({ length: 4 }, () => randomSeed());
    const mixed: { style: AvatarStyle; seed: string }[] = [];
    for (const seed of seeds) {
      mixed.push({ style: "micah", seed });
      mixed.push({ style: "adventurer", seed });
      mixed.push({ style: "notionists", seed });
    }
    for (let i = mixed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
    }
    setSelected(null);
    setGrid(mixed);
  };

  const handleContinue = async () => {
    if (!selected || !user) return;
    setIsSaving(true);
    try {
      const res = await api.post("/users/set-avatar.php", {
        style: selected.style,
        seed: selected.seed,
      });

      if (res.data?.success) {
        updateUser(res.data.data.user);
        navigate(redirectTo, { replace: true });
      } else {
        // fallback: stay on page
        // eslint-disable-next-line no-console
        console.error(res.data?.message || "Failed to save avatar");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen w-screen flex flex-col">
      {/* Copy of the injected auth CSS from the Register page (`sign-up.tsx`) so styling matches exactly. */}
      <style>{`input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; } input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: var(--foreground) !important; } @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; } @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; } .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); } .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); } .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); pointer-events: none; } .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 15%); } .glass-input-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 9999px; } .glass-input { display: flex; position: relative; width: 100%; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); } .glass-input { background: transparent !important; box-shadow: none !important; border: 1px solid rgba(255,255,255,0.18) !important; } .glass-input::after { background: transparent !important; box-shadow: none !important; } .glass-input-text-area::after { opacity: 0.18 !important; }`}</style>

      {/* Header logo/title removed per design: keep the picker focused on avatars only. */}

      <div className={cn("flex w-full flex-1 h-full items-center justify-center bg-[rgb(var(--secondary))]", "relative overflow-hidden")}>
        <div className="absolute inset-0 z-0">
          <GradientBackground />
        </div>

        <fieldset disabled={isSaving} className="relative z-10 flex flex-col items-center gap-8 w-[280px] mx-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="avatar-onboarding"
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full flex flex-col items-center gap-4"
            >
              <BlurFade delay={0.25 * 1} className="w-full">
                <div className="text-center">
                  <p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground whitespace-nowrap">
                    Choose an avatar
                  </p>
                </div>
              </BlurFade>

              <BlurFade delay={0.25 * 2}>
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Pick one to use as your profile picture.
                </p>
              </BlurFade>

              <BlurFade delay={0.25 * 3} className="w-[300px]">
                <div className="grid grid-cols-3 gap-3">
                  {grid.map((opt) => {
                    const isSelected = selected?.style === opt.style && selected?.seed === opt.seed;
                    return (
                      <motion.button
                        key={`${opt.style}:${opt.seed}`}
                        type="button"
                        onClick={() => setSelected(opt)}
                        whileTap={{ scale: 0.96 }}
                        animate={
                          isSelected
                            ? {
                                scale: 1.08,
                                boxShadow: "0 0 0 2px rgba(255,255,255,0.55), 0 12px 30px rgba(0,0,0,0.25)",
                              }
                            : { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
                        }
                        transition={{ type: "spring", stiffness: 520, damping: 28 }}
                        className={cn(
                          "rounded-2xl border backdrop-blur-sm p-2 transition",
                          isSelected
                            ? "border-white/70 ring-2 ring-white/40 bg-white/15"
                            : "border-white/15 hover:border-white/30 bg-white/5"
                        )}
                      >
                        <img
                          src={dicebearUrl(opt.style, opt.seed)}
                          alt={`${opt.style} avatar`}
                          className={cn(
                            "w-full h-auto rounded-xl transition",
                            isSelected ? "saturate-150" : "opacity-90"
                          )}
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </BlurFade>

              <BlurFade delay={0.25 * 4} className="w-[300px] flex flex-col gap-5">
                <GlassButton type="button" onClick={reshuffle} className="w-full glass-ultra">
                  <Shuffle className="w-4 h-4" /> Shuffle
                </GlassButton>

                <GlassButton type="button" onClick={handleContinue} disabled={!selected || isSaving} className="w-full">
                  Continue <ArrowRight className="w-4 h-4" />
                </GlassButton>

                <GlassButton
                  type="button"
                  onClick={() => navigate(redirectTo, { replace: true })}
                  className="w-full glass-ultra"
                >
                  Skip for now
                </GlassButton>

              </BlurFade>
            </motion.div>
          </AnimatePresence>
        </fieldset>
      </div>
    </div>
  );
};
