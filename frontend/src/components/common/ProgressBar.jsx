import React from "react";
const ProgressBar = ({
  progress,
  showLabel = true,
  size = "md",
  color = "primary",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };
  const colorClasses = {
    primary: "from-primary-500 to-primary-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
  };
  return (
    <div className={className}>
      {" "}
      {showLabel && (
        <div className="flex items-center justify-between text-sm mb-1">
          {" "}
          <span className="text-gray-600 font-medium"> Progress </span>{" "}
          <span
            className="font-semibold"
            style={{
              color: "#5E35B1",
            }}
          >
            {" "}
            {progress} %
          </span>{" "}
        </div>
      )}{" "}
      <div className={`progress-bar ${sizeClasses[size]}`}>
        {" "}
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(to right, #E3F2FD, #E8F5E9)",
          }}
        ></div>{" "}
      </div>{" "}
    </div>
  );
};
export default ProgressBar;
