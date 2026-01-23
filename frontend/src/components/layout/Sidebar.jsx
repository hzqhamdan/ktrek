import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminSidebarIcon } from "../ui/admin-sidebar-icon";

const Sidebar = ({ isOpen, close }) => {
  const navigate = useNavigate();

  // Check login status
  const isLoggedIn =
    localStorage.getItem("token") || localStorage.getItem("user");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    close();
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 bg-white shadow-lg w-64 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50`}
    >
      {/* Close Button */}{" "}
      <button
        onClick={close}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
      >
        <AdminSidebarIcon name="dashboard" className="w-5 h-5" />
      </button>
      {/* Sidebar Content */}{" "}
      <div className="p-6">
        <div className="mb-6">
          <img 
            src="/images/logo.png" 
            alt="K-Trek" 
            className="h-12 w-auto"
          />
        </div>
        {/* Navigation Links */}
        <nav className="space-y-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Home
              </Link>
              <Link
                to="/dashboard/attractions"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Attractions
              </Link>
              <Link
                to="/dashboard/progress"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Progress
              </Link>
              <Link
                to="/dashboard/rewards"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Rewards
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Home
              </Link>
              <Link
                to="/login"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="block text-gray-700 hover:text-[#120c07] font-medium"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
      {/* Logout Button (Only shown if logged in) */}{" "}
      {isLoggedIn && (
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-left text-red-600 font-semibold hover:text-red-800"
          >
            Logout{" "}
          </button>{" "}
        </div>
      )}{" "}
    </div>
  );
};

export default Sidebar;
