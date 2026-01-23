"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  className?: string;
  /** Optional custom trigger button content (e.g., avatar). */
  trigger?: React.ReactNode;
};

const FloatingActionMenu = ({ options, className, trigger }: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn("fixed bottom-8 right-8 z-[80]", className)}>
      {trigger ? (
        <button
          type="button"
          onClick={toggleMenu}
          className={cn("floating-avatar-trigger w-10 h-10 p-0 border-0 overflow-hidden cursor-pointer")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            backgroundColor: "#ffffff",
            boxShadow: "none",
            outline: "none",
            lineHeight: 0,
            display: "block",
          }}
        >
          <div style={{ width: "100%", height: "100%", borderRadius: 9999, overflow: "hidden" }}>
            {trigger}
          </div>
        </button>
      ) : (
        <Button
          onClick={toggleMenu}
          className="auth-plain-btn w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 shadow-lg cursor-pointer"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <Plus className="w-6 h-6" />
          </motion.div>
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: -10, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 10, y: -10, filter: "blur(10px)" }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="absolute top-12 right-0 mt-2"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                  }}
                >
                  <Button
                    onClick={option.onClick}
                    size="sm"
                    className="auth-plain-btn flex items-center gap-2 bg-primary-600/90 text-white hover:bg-primary-700 shadow-lg border-none rounded-xl backdrop-blur-sm h-9 px-3 text-sm"
                  >
                    {option.Icon}
                    <span className="whitespace-nowrap">{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
