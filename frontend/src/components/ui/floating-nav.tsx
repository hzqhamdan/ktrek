"use client";

import React from "react";
import { Home, MapPin, BarChart3, Gift, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";

type NavItem = {
  id: number;
  icon: React.ReactNode;
  label: string;
  href: string;
};

/**
 * Floating bottom navigation
 * Visuals: matches the original component structure (pill, spacing, thickness)
 * Behavior: uses NavLink for reliable single-click navigation
 */
const FloatingNav = () => {
  const items: NavItem[] = [
    { id: 0, icon: <Home size={22} />, label: "Home", href: "/dashboard" },
    {
      id: 1,
      icon: <MapPin size={22} />,
      label: "Attractions",
      href: "/dashboard/attractions",
    },
    {
      id: 2,
      icon: <BarChart3 size={22} />,
      label: "Progress",
      href: "/dashboard/progress",
    },
    { id: 3, icon: <Gift size={22} />, label: "Rewards", href: "/dashboard/rewards" },
    { id: 4, icon: <FileText size={22} />, label: "Reports", href: "/dashboard/reports" },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex justify-center px-3">
      <div
        className="relative w-full flex items-center justify-between shadow-xl rounded-full px-2 py-1 border overflow-hidden"
        style={{
          backgroundColor: "#F1EEE7",
          borderColor: "rgba(0,0,0,0.10)",
          maxWidth: "900px",
        }}
      >
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.href}
            end={item.href === "/dashboard"}
            className={({ isActive }) =>
              [
                // original spacing/thickness
                "relative flex flex-col items-center justify-center flex-1 px-2 py-2 text-sm font-medium",
                // keep these stable regardless of global button styles
                "no-underline",
                isActive ? "text-[#E16A02]" : "text-gray-600",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 left-1 right-1 rounded-full pointer-events-none"
                    style={{ backgroundColor: "rgba(225, 106, 2, 0.14)" }}
                  />
                ) : null}

                <div className="relative z-10">{item.icon}</div>
                {/* hide labels on small screens */}
                <span className="relative z-10 text-xs mt-1 hidden sm:block">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default FloatingNav;
