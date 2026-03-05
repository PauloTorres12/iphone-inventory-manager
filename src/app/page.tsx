import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import BackgroundGrid from "@/components/BackgroundGrid";

export default function Home() {
    return (
        <main>
            <BackgroundGrid />
            <Navbar />
            <Hero />
            <div id="catalogo" className="scroll-mt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6 text-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        Catálogo disponible
                    </h2>
                </div>
                <ProductGrid />
            </div>

            {/* Footer */}
            <footer
                id="contacto"
                className="border-t border-slate-100 py-10 px-4 text-center"
            >
                <p className="text-slate-400 text-sm">
                    © {new Date().getFullYear()} DigicoWorld · Todos los derechos reservados
                </p>
            </footer>
        </main>
    );
}
