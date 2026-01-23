import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

import FloatingNav from "../ui/floating-nav";
import FloatingActionMenu from "../ui/floating-action-menu";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Bottom navigation is fixed; add enough padding so content isn't hidden behind it.
  const contentBottomPadding = "pb-28";

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // If API fails, still log out locally.
      console.error("Logout error:", e);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F1EEE7" }}>
      <div className="flex-1">
        <header
          className="p-4 shadow flex items-center justify-between relative z-50"
          style={{ backgroundColor: "#F1EEE7" }}
        >
          {/* Left: logo (unchanged) */}
          <button
            type="button"
            onClick={() => navigate(user ? "/dashboard" : "/")}
            className="auth-plain-btn flex items-center gap-3 cursor-pointer"
            style={{ background: "transparent", padding: 0, border: 0 }}
          >
            <img src="/images/logo.png" alt="K-Trek" className="h-10 sm:h-12 w-auto" />
          </button>

          {/* Center: K-Trek text only */}
          <button
            type="button"
            onClick={() => navigate(user ? "/dashboard" : "/")}
            className="auth-plain-btn absolute left-1/2 -translate-x-1/2"
            style={{ background: "transparent", padding: 0, border: 0 }}
          >
            <span
              className="text-2xl font-semibold"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: "#000" }}
            >
              K-Trek
            </span>
          </button>

          {/* Right side user actions (only when logged in) */}
          <div className="flex items-center justify-end">
            {user ? (
              <FloatingActionMenu
                className="top-4 right-4 bottom-auto z-[80]"
              trigger={(() => {
                const normalizeDicebear = (u) => {
                  if (!u) return u;
                  if (!u.includes("api.dicebear.com")) return u;
                  // Force a neutral background so the trigger doesn't look like an orange button
                  return u.includes("backgroundColor=")
                    ? u
                    : `${u}${u.includes("?") ? "&" : "?"}backgroundColor=ffffff`;
                };

                const url = user?.profile_picture
                  ? normalizeDicebear(user.profile_picture)
                  : user?.avatar_seed
                    ? normalizeDicebear(
                        `https://api.dicebear.com/9.x/${user?.avatar_style || "micah"}/svg?seed=${encodeURIComponent(user.avatar_seed)}`
                      )
                    : null;

                return url ? (
                  <div
                    className="w-full h-full rounded-full overflow-hidden"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <img
                      src={url}
                      alt="Profile"
                      style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                );
              })()}
              options={[
                {
                  label: "Profile",
                  Icon: <User className="w-4 h-4" />,
                  onClick: () => navigate("/dashboard/profile"),
                },
                {
                  label: "Change Avatar",
                  Icon: <User className="w-4 h-4" />,
                  onClick: () => navigate("/onboarding/avatar?redirect=/dashboard/profile"),
                },
                {
                  label: "Logout",
                  Icon: <LogOut className="w-4 h-4" />,
                  onClick: handleLogout,
                },
              ]}
              />
            ) : null}
          </div>
        </header>

        <main className={`p-4 ${contentBottomPadding}`}>
          <Outlet />
        </main>
      </div>

      <FloatingNav />
    </div>
  );
};
export default Layout;
