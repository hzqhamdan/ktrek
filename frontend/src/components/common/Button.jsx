import React from "react";
import { Loader2 } from "lucide-react";
const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none !border-0";

  // `glass` is a UI-only variant that relies on the global `.glass-button` CSS.
  // It intentionally avoids inline background colors so the glass effect can show.
  const variantClasses = {
    // Glass buttons should feel lighter/cleaner, consistent with the app's glass CTAs.
    glass: "glass-button font-medium",

    primary: "font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 border-0",
    secondary: "font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 border-0",
    accent: "font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 border-0",
    outline: "font-semibold bg-white border-0 hover:opacity-80",
    ghost: "font-semibold bg-transparent text-gray-700 hover:opacity-80 border-0",
    danger: "font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 border-0",
  };
  const getVariantStyle = (variant) => {
    // For glass, we rely purely on CSS classes (no inline styles).
    if (variant === "glass") return undefined;

    const styles = {
      primary: {
        backgroundColor: "#e16a02",
        color: "#2c3445",
        border: "none",
      },
      secondary: {
        backgroundColor: "#E8F5E9",
        color: "#2E7D32",
        border: "none",
      },
      accent: {
        backgroundColor: "#FCE4EC",
        color: "#C2185B",
        border: "none",
      },
      outline: {
        color: "#5E35B1",
        border: "none",
      },
      ghost: {
        color: "#5E35B1",
        border: "none",
      },
      danger: {
        backgroundColor: "#FCE4EC",
        color: "#C2185B",
        border: "none",
      },
    };
    return styles[variant] || styles.primary;
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-6 py-2.5 text-lg",
  };
  const widthClass = fullWidth ? "w-full" : "";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={getVariantStyle(variant)}
      className={` ${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${widthClass} ${className} `}
      {...props}
    >
      {" "}
      {isLoading ? (
        <>
          {" "}
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>{" "}
        </>
      ) : (
        <>
          {" "}
          {Icon && <Icon className="h-5 w-5" />}
          <span>{children}</span>{" "}
        </>
      )}{" "}
    </button>
  );
};
export default Button;
