"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative pt-28 pb-12 px-4 sm:px-6 text-center overflow-hidden">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-br from-sky-100 via-slate-50 to-white rounded-full blur-3xl opacity-60" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl mx-auto"
            >
                {/* Eyebrow */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-full mb-5 border border-sky-100">
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse" />
                    iPhones con garantía
                </span>

                {/* Title */}
                <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
                    Tu próximo iPhone,
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
                        al mejor precio.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-slate-500 text-base sm:text-lg mb-8 max-w-md mx-auto px-6 leading-relaxed">
                    Catálogo de iPhones nuevos y seminuevos con batería original.
                </p>

                {/* CTA */}
                <div className="flex justify-center">
                    <a
                        href="#catalogo"
                        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-medium text-sm transition-colors duration-200"
                    >
                        Ver catálogo
                        <ChevronDown className="w-4 h-4" />
                    </a>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex justify-center gap-8 sm:gap-16 mt-12 pt-8 border-t border-slate-100"
            >
                {[
                    { value: "100%", label: "Verificados" },
                    { value: "Batería", label: "Certificada" },
                    { value: "Envío", label: "a todo el país" },
                ].map((stat) => (
                    <div key={stat.label} className="text-center">
                        <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </motion.div>
        </section>
    );
}
