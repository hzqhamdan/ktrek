import React from "react";
import ClassicLoader from "../ui/loader";
import ModifiedClassicLoader from "../ui/demo";

const Loading = ({ 
  fullScreen = false, 
  size = "md", 
  message = "",
  variant = "modified" // "gradient", "classic", or "modified"
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-14 h-14 border-3",
    lg: "w-20 h-20 border-4",
  };
  
  const loaderSizeClasses = {
    sm: "scale-75",
    md: "scale-100",
    lg: "scale-150",
  };
  
  const spinnerClass = sizeClasses[size] || sizeClasses.md;
  const loaderScale = loaderSizeClasses[size] || loaderSizeClasses.md;
  
  // Choose spinner based on variant
  let spinnerElement;
  
  if (variant === "classic") {
    spinnerElement = (
      <div className={loaderScale}>
        <ClassicLoader />
      </div>
    );
  } else if (variant === "modified") {
    spinnerElement = (
      <div className={loaderScale}>
        <ModifiedClassicLoader />
      </div>
    );
  } else {
    // Default gradient spinner
    spinnerElement = (
      <div className="relative">
        <div
          className={`${spinnerClass} border-t-transparent rounded-full animate-spin`}
          style={{
            borderColor: "#EDE7F6",
            borderTopColor: "transparent",
            background:
              "conic-gradient(from 0deg, #E3F2FD, #E8F5E9, #FCE4EC, #FFF9C4, #EDE7F6)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff 0)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff 0)",
          }}
        />
      </div>
    );
  }
  
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
      {spinnerElement}
      {message && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-background-light via-background-cream to-background-soft backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-12">{spinner}</div>
  );
};

export default Loading;
