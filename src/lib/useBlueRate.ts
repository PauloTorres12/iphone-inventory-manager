"use client";

import { useState, useEffect } from "react";

let cachedRate: number | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export function useBlueRate() {
    const [rate, setRate] = useState<number | null>(cachedRate);
    const [loading, setLoading] = useState(!cachedRate);

    useEffect(() => {
        if (cachedRate && Date.now() - cacheTime < CACHE_TTL) {
            setRate(cachedRate);
            setLoading(false);
            return;
        }
        fetch("https://dolarapi.com/v1/dolares/blue")
            .then((r) => r.json())
            .then((d) => {
                const avg = Math.round((d.compra + d.venta) / 2);
                cachedRate = avg;
                cacheTime = Date.now();
                setRate(avg);
            })
            .catch(() => setRate(null))
            .finally(() => setLoading(false));
    }, []);

    return { rate, loading };
}

export function arsToUsd(ars: number, rate: number | null): string {
    if (!rate || !ars) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(Math.round(ars / rate));
}

/** Format a fixed USD price directly */
export function formatUsd(usd: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(usd);
}

/** Convert fixed USD price to ARS using live blue rate */
export function usdToArs(usd: number, rate: number | null): string {
    if (!rate || !usd) return "—";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(Math.round(usd * rate));
}
