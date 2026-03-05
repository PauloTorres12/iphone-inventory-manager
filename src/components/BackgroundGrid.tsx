"use client";

import { motion } from "framer-motion";

// Orbes flotantes en tonos muy suaves para no romper la paleta blanca
const orbs = [
    { width: 400, height: 400, x: "5%", y: "10%", color: "from-sky-100/60 to-transparent", duration: 18, delay: 0 },
    { width: 300, height: 300, x: "70%", y: "5%", color: "from-slate-100/80 to-transparent", duration: 22, delay: 3 },
    { width: 350, height: 350, x: "55%", y: "60%", color: "from-blue-50/70 to-transparent", duration: 25, delay: 6 },
    { width: 250, height: 250, x: "10%", y: "65%", color: "from-indigo-50/60 to-transparent", duration: 20, delay: 9 },
    { width: 280, height: 280, x: "40%", y: "35%", color: "from-slate-100/50 to-transparent", duration: 30, delay: 2 },
];

export default function BackgroundGrid() {
    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        >
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    className={`absolute rounded-full bg-radial-[at_30%_30%] bg-gradient-radial ${orb.color}`}
                    style={{
                        width: orb.width,
                        height: orb.height,
                        left: orb.x,
                        top: orb.y,
                        background: `radial-gradient(circle at 40% 40%, var(--tw-gradient-from, rgb(224 242 254 / 0.6)), transparent 70%)`,
                    }}
                    animate={{
                        x: [0, 30, -20, 15, 0],
                        y: [0, -25, 20, -10, 0],
                        scale: [1, 1.08, 0.95, 1.04, 1],
                    }}
                    transition={{
                        duration: orb.duration,
                        delay: orb.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Gradient vignette — bordes más blancos para que el grid se "funda" */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
        </div>
    );
}
