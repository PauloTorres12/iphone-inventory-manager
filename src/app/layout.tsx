import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DigicoWorld",
    description:
        "Catálogo de iPhones nuevos y seminuevos con batería certificada. Compra segura, envío a todo el país.",
    openGraph: {
        title: "DigicoWorld — iPhones verificados",
        description: "Catálogo de iPhones con batería certificada al mejor precio.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body suppressHydrationWarning className={`${inter.className} bg-white text-slate-900 antialiased`}>
                {children}
            </body>
        </html>
    );
}
