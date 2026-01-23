// src/components/auth/AuthDivider.jsx import React from 'react';

const AuthDivider = ({
  text = "OR",
  bgClassName = "bg-white",
  colorClassName = "text-gray-500",
  lineClassName = "border-gray-300",
}) => {
  return (
    <div className="relative my-6">
      {" "}
      <div className="absolute inset-0 flex items-center">
        {" "}
        <div className={`w-full border-t ${lineClassName}`}></div>{" "}
      </div>{" "}
      <div className="relative flex justify-center text-sm">
        {" "}
        <span className={`px-4 ${bgClassName} ${colorClassName} font-medium`}>
          {text}
        </span>{" "}
      </div>{" "}
    </div>
  );
};

export default AuthDivider;
