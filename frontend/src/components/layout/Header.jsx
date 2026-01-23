import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  MapPin,
  Award,
  TrendingUp,
  LogOut,
  Home,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authAPI } from "../../api/auth";
import { useToast } from "../ui/toast-1";
const Header = () => {
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      showToast("Logged out successfully", "success");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Logout locally even if API call fails
      logout();
      navigate("/login");
    }
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/attractions", label: "Attractions", icon: MapPin },
    { to: "/progress", label: "Progress", icon: TrendingUp },
    { to: "/rewards", label: "Rewards", icon: Award },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };
  return (
    <header
      className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b-2"
      style={{ borderColor: "#EDE7F6" }}
    >
      {" "}
      <div className="container-custom">
        {" "}
        <div className="flex items-center justify-between h-16">
          {" "}
          {/* Logo */}{" "}
          <Link to="/" className="flex items-center space-x-2 group">
            {" "}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
              style={{ backgroundColor: "#EDE7F6" }}
            >
              {" "}
              <span className="font-bold text-xl" style={{ color: "#5E35B1" }}>
                K
              </span>{" "}
            </div>{" "}
            <span
              className="text-xl font-bold hidden sm:inline"
              style={{ color: "#5E35B1" }}
            >
              {" "}
              <img 
                src="/images/logo.png" 
                alt="K-Trek" 
                className="h-10 sm:h-12 w-auto"
              />
            </span>{" "}
          </Link>{" "}
          {/* Desktop Navigation */}{" "}
          <nav className="hidden md:flex items-center space-x-2">
            {" "}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${isActive(link.to) ? "shadow-md" : "text-gray-600 hover:shadow-sm"}`}
                  style={
                    isActive(link.to)
                      ? { backgroundColor: "#EDE7F6", color: "#5E35B1" }
                      : {}
                  }
                  onMouseEnter={(e) =>
                    !isActive(link.to) &&
                    (e.currentTarget.style.backgroundColor = "#E3F2FD")
                  }
                  onMouseLeave={(e) =>
                    !isActive(link.to) &&
                    (e.currentTarget.style.backgroundColor = "")
                  }
                >
                  {" "}
                  <Icon size={20} />{" "}
                  <span className="font-medium">{link.label}</span>{" "}
                </Link>
              );
            })}{" "}
          </nav>{" "}
          {/* User Menu - Desktop */}{" "}
          <div className="hidden md:flex items-center space-x-3">
            {" "}
            <div className="px-4 py-2 text-gray-700 font-medium">{user?.username}</div>{" "}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-sm"
              style={{ color: "#C2185B" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#FCE4EC")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {" "}
              <LogOut size={20} />{" "}
              <span className="font-medium">Logout</span>{" "}
            </button>{" "}
          </div>{" "}
          {/* Mobile Menu Button */}{" "}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl transition-all duration-300"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#EDE7F6")
            }
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            {" "}
            {isMenuOpen ? (
              <X size={24} style={{ color: "#5E35B1" }} />
            ) : (
              <Menu size={24} style={{ color: "#5E35B1" }} />
            )}{" "}
          </button>{" "}
        </div>{" "}
        {/* Mobile Navigation */}{" "}
        {isMenuOpen && (
          <nav
            className="md:hidden py-4 border-t-2 animate-fade-in"
            style={{ borderColor: "#EDE7F6" }}
          >
            {" "}
            <div className="space-y-2">
              {" "}
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive(link.to) ? "shadow-sm" : "text-gray-600"}`}
                    style={
                      isActive(link.to)
                        ? { backgroundColor: "#EDE7F6", color: "#5E35B1" }
                        : {}
                    }
                    onMouseEnter={(e) =>
                      !isActive(link.to) &&
                      (e.currentTarget.style.backgroundColor = "#E3F2FD")
                    }
                    onMouseLeave={(e) =>
                      !isActive(link.to) &&
                      (e.currentTarget.style.backgroundColor = "")
                    }
                  >
                    {" "}
                    <Icon size={20} />{" "}
                    <span className="font-medium">{link.label}</span>{" "}
                  </Link>
                );
              })}{" "}
              <div
                className="h-px my-3"
                style={{
                  background:
                    "linear-gradient(to right, #E3F2FD, #E8F5E9, #FCE4EC)",
                }}
              />{" "}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300"
                style={{ color: "#C2185B" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FCE4EC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "")
                }
              >
                {" "}
                <LogOut size={20} />{" "}
                <span className="font-medium">Logout</span>{" "}
              </button>{" "}
            </div>{" "}
          </nav>
        )}{" "}
      </div>{" "}
    </header>
  );
};
export default Header;
