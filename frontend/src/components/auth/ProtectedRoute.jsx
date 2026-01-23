import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";
import Loading from "../common/Loading";
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, setAuth, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }
      try {
        const res = await authAPI.verifySession();
        if (res.success) {
          setAuth(res.data.user, token);
        } else {
          logout();
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        logout();
      } finally {
        setIsVerifying(false);
      }
    };
    verify();
  }, [token, setAuth, logout]);
  if (isVerifying) return <Loading fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};
export default ProtectedRoute;
