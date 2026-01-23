import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AvatarOnboarding } from "../components/ui/avatar-onboarding";
import { useAuthStore } from "../store/authStore";

const AvatarOnboardingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const params = new URLSearchParams(location.search);
  const redirectParam = params.get("redirect");
  const redirectTo = redirectParam && redirectParam.startsWith("/") && !redirectParam.includes("://")
    ? redirectParam
    : null;

  // If user already has an avatar, skip onboarding
  useEffect(() => {
    if (!user) return;
    // If this page is used as a generic avatar picker (redirect is set), don't auto-skip.
    if (redirectTo) return;

    // Only skip in true onboarding mode if the user already picked an avatar
    if (user?.avatar_seed) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate, redirectTo]);

  return (
    <div className="relative">
      <AvatarOnboarding />
    </div>
  );
};

export default AvatarOnboardingPage;
