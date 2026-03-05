"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-3">
                <div
                    className={`max-w-6xl mx-auto rounded-2xl border transition-all duration-300 ${scrolled
                        ? "bg-white/90 backdrop-blur-md shadow-md border-slate-200/80"
                        : "bg-white/75 backdrop-blur-sm border-slate-200/50 shadow-sm"
                        }`}
                >
                    {/* Mobile: centered logo only. Desktop: logo left + WhatsApp right */}
                    <nav className="px-5 flex items-center justify-center sm:justify-between" style={{ height: "52px" }}>
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-slate-800 text-sm tracking-tight">
                                Digico<span className="text-sky-500">World</span>
                            </span>
                        </Link>

                        {/* Desktop only */}
                        <a
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491112345678"}?text=${encodeURIComponent("¡Hola! Quiero consultar sobre un iPhone.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full transition-colors duration-200"
                        >
                            WhatsApp
                        </a>
                    </nav>
                </div>
            </header>
        </>
    );
}
