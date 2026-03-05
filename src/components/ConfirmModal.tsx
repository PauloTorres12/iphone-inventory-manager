"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel = "Eliminar",
    onConfirm,
    onCancel,
    danger = true,
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onCancel()}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 12 }}
                    transition={{ type: "spring", damping: 25, stiffness: 360 }}
                    className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl"
                >
                    {/* Icon */}
                    {danger && (
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                    )}

                    {/* Text */}
                    <h3 className="font-bold text-slate-800 text-base mb-1">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 rounded-2xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-colors ${danger
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-slate-900 hover:bg-slate-700 text-white"
                                }`}
                        >
                            {danger && <Trash2 className="w-4 h-4" />}
                            {confirmLabel}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
