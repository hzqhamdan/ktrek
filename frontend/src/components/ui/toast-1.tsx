'use client';

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleCheck, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

type ToastPositionWithMobile = ToastPosition | 'top' | 'bottom';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, position?: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<
    { toast: Toast; position: ToastPosition }[]
  >([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      position: ToastPosition = 'bottom-right'
    ) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { toast: { id, message, type }, position }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter(({ toast }) => toast.id !== id));
      }, 5000);
    },
    []
  );

  if (!isMounted) {
    return null;
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {(
        ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as const
      ).map((position) => (
        <ToastContainer
          key={position}
          toasts={toasts.filter((t) => t.position === position)}
          position={position}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: { toast: Toast; position: ToastPosition }[];
  position: ToastPosition;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, position }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const adjustedPosition: ToastPositionWithMobile = isMobile
    ? position.startsWith('top')
      ? 'top'
      : 'bottom'
    : position;

  const getPositionClasses = () => {
    switch (adjustedPosition) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return '';
    }
  };

  const getInitialY = () => {
    if (adjustedPosition.startsWith('top')) {
      return -50;
    }
    if (adjustedPosition === 'center') {
      return 0;
    }
    return 50;
  };

  return (
    <div
      className={`fixed ${getPositionClasses()} w-full max-w-full sm:max-w-sm px-4 sm:px-0 space-y-2 z-[9999]`}
    >
      <AnimatePresence>
        {toasts.map(({ toast }) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: getInitialY() }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: getInitialY() }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <ToastComponent {...toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastComponent: React.FC<Toast> = ({ message, type }) => {
  const typeConfig = {
    success: {
      icon: CircleCheck,
      headerBg: 'bg-green-500',
      iconBg: 'bg-white',
      iconColor: 'text-green-500',
      title: 'Success!',
    },
    error: {
      icon: AlertCircle,
      headerBg: 'bg-red-500',
      iconBg: 'bg-white',
      iconColor: 'text-red-500',
      title: 'Error!',
    },
    warning: {
      icon: AlertTriangle,
      headerBg: 'bg-yellow-500',
      iconBg: 'bg-white',
      iconColor: 'text-yellow-600',
      title: 'Warning!',
    },
    info: {
      icon: Info,
      headerBg: 'bg-blue-500',
      iconBg: 'bg-white',
      iconColor: 'text-blue-500',
      title: 'Info',
    },
  } as const;

  const { icon: Icon, headerBg, iconBg, iconColor, title } = typeConfig[type];

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full">
      {/* Colored Header Section */}
      <div className={`${headerBg} pt-8 pb-6 flex flex-col items-center`}>
        <div className={`${iconBg} rounded-full p-4 shadow-lg`}>
          <Icon className={`${iconColor} w-8 h-8`} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* White Content Section */}
      <div className="px-6 py-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
      </div>
    </div>
  );
};
