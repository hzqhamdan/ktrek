import React from "react";
import { cn } from "../../lib/utils";

/**
 * AdminSidebarIcon
 * Reuses the same minimal inline SVG set used in the admin panel sidebar
 * (see admin/components/ui/sidebar.php -> kt_sidebar_icon).
 */
export function AdminSidebarIcon({
  name,
  className,
  title,
  ...props
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": title ? undefined : true,
    role: title ? "img" : "presentation",
    ...props,
  };

  const paths = {
    dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    attractions:
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
    tasks: "M9 11H7V9h2v2zm0 6H7v-2h2v2zm0-12H7V3h2v2zm4 6h8V9h-8v2zm0 6h8v-2h-8v2zM13 5h8V3h-8v2z",
    guides:
      "M18 2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10V2zm-2 18H8V4h8v16zm-6-2h6v-2h-6v2zm0-4h6v-2h-6v2zm0-4h6V8h-6v2z",
    rewards:
      "M20 7h-3V4H7v3H4v4c0 2.21 1.79 4 4 4h.17A5.99 5.99 0 0 0 11 18.83V22h2v-3.17A5.99 5.99 0 0 0 15.83 15H16c2.21 0 4-1.79 4-4V7zM6 11V9h1v4.03C6.42 12.69 6 11.9 6 11zm12 0c0 .9-.42 1.69-1 2.03V9h1v2z",
    reports:
      "M4 4h16v12H5.17L4 17.17V4zm2 2v8h12V6H6zm0 14h12v-2H8l-2 2z",
    userProgress: "M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2v-4h-2v4zm4 0h2V4h-2v13zm4 0h2v-9h-2v9z",
    adminUsers:
      "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h7v-2.5c0-2.33-4.67-3.5-7-3.5z",
    default:
      "M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z",
  };

  const d = paths[name] || paths.default;

  return (
    <svg className={cn("inline-block", className)} {...common}>
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}
