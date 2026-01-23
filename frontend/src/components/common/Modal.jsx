import React, { useEffect } from "react";
import { X } from "lucide-react";
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {" "}
      {/* Backdrop */}{" "}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>{" "}
      {/* Modal */}{" "}
      <div className="flex min-h-screen items-center justify-center p-4">
        {" "}
        <div
          className={`relative rounded-2xl shadow-xl w-full ${sizeClasses[size]} animate-slide-up`}
          style={{ backgroundColor: '#F1EEE7' }}
          onClick={(e) => e.stopPropagation()}
        >
          {" "}
          {/* Header */}{" "}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              {" "}
              {title && (
                <h3 className="text-xl font-bold text-gray-900"> {title} </h3>
              )}{" "}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="auth-plain-btn h-9 w-9 rounded-full bg-transparent hover:bg-black/5 transition flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}{" "}
            </div>
          )}{" "}
          {/* Content */} <div className="px-6 py-4"> {children} </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
export default Modal;
