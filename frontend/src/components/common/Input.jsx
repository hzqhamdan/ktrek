import React from "react";
const Input = ({
  label,
  id,
  type = "text",
  error,
  icon: Icon,
  className = "",
  ...props
}) => {
  return (
    <div className={className}>
      {" "}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {" "}
          {label}{" "}
        </label>
      )}{" "}
      <div className="relative">
        {" "}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {" "}
            <Icon className="h-5 w-5 text-gray-700" />{" "}
          </div>
        )}{" "}
        <input
          id={id}
          type={type}
          className={` w-full px-4 py-3 ${Icon ? "pl-12" : ""} border-2 ${error ? "border-gray-200 focus:border-gray-200 " : "border-gray-200 focus:border-gray-200 "} rounded-xl text-gray-700 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 `}
          style={{ backgroundColor: '#F1EEE7' }}
          {...props}
        />{" "}
      </div>{" "}
      {error && (
        <p className="mt-2 text-sm text-gray-700 flex items-center">
          {" "}
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            {" "}
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />{" "}
          </svg>{" "}
          {error}{" "}
        </p>
      )}{" "}
    </div>
  );
};
export default Input;
