"use client";

import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            Icon = CheckCircle;
            colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'bg-red-50 text-red-800 border-red-200';
            iconColor = 'text-red-500';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${colorClass}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className="font-semibold text-sm flex-1 mr-4">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
