import React from "react";
const Card = ({
  children,
  className = "",
  hoverable = false,
  bordered = false,
  padding = "md",
  gradient = false,
  onClick,
  ...props
}) => {
  const baseClasses =
    "rounded-2xl shadow-md transition-all duration-300 border-2";
  const hoverClass = hoverable
    ? "cursor-pointer hover:shadow-xl hover:-translate-y-1"
    : "";
  const borderClass = bordered ? "border-2" : "";
  const gradientClass = gradient ? "" : "";
  const getBorderStyle = () => ({
    borderColor: "#e5e7eb", // gray-200
  });
  const getGradientStyle = () =>
    gradient
      ? {
          background:
            "linear-gradient(135deg, rgba(241,238,231,0.95) 0%, #ffffff 55%, rgba(225,106,2,0.08) 100%)",
        }
      : {};
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  return (
    <div
      className={` ${baseClasses} ${hoverClass} ${borderClass} ${gradientClass} ${paddingClasses[padding] || paddingClasses.md} ${className} `}
      style={{
        backgroundColor: gradient ? undefined : '#F1EEE7',
        ...getBorderStyle(),
        ...getGradientStyle(),
      }}
      onClick={onClick}
      {...props}
    >
      {" "}
      {children}{" "}
    </div>
  );
};
export default Card;
