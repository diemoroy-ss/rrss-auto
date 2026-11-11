import Link from "next/link";
import SocialPilotLogo from "../SocialPilotLogo";
import type { ProductVertical } from "./ProductEcosystemBar";

interface ProductEcosystemFooterProps {
  currentVertical: ProductVertical;
  tagline: string;
}

export default function ProductEcosystemFooter({
  currentVertical,
  tagline,
}: ProductEcosystemFooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-[#F4F1EA] text-stone-700">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <SocialPilotLogo height={36} width={165} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-stone-600">
              {tagline}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-stone-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Una sola cuenta · Catálogo central compartido</span>
            </div>
          </div>

          {/* Col 2: Ecosistema */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Productos Independientes
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/marketing"
                  className={`inline-flex items-center gap-2 hover:text-stone-950 transition-colors ${
                    currentVertical === "marketing" ? "font-bold text-stone-950" : "text-stone-600"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E04F16]" />
                  <span>SocialPilot Marketing</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/menu"
                  className={`inline-flex items-center gap-2 hover:text-stone-950 transition-colors ${
                    currentVertical === "menu" ? "font-bold text-stone-950" : "text-stone-600"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                  <span>SocialPilot Carta QR</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/fideliza"
                  className={`inline-flex items-center gap-2 hover:text-stone-950 transition-colors ${
                    currentVertical === "fideliza" ? "font-bold text-stone-950" : "text-stone-600"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#047857]" />
                  <span>SocialPilot Fideliza</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-stone-600 hover:text-stone-950 transition-colors"
                >
                  Ver plataforma completa →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Accesos Directos */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li>
                <Link href="/login" className="hover:text-stone-950 transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link href="/registro" className="hover:text-stone-950 transition-colors">
                  Crear cuenta gratis
                </Link>
              </li>
              <li>
                <Link
                  href="/menu/AGdJLwdz0QNhBPcRp1FdWWMooAb2___default"
                  className="hover:text-stone-950 transition-colors"
                >
                  Carta QR en vivo
                </Link>
              </li>
              <li>
                <Link href="/fideliza/caja" className="hover:text-stone-950 transition-colors">
                  Terminal de Caja
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Soporte */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900">
              Respaldo & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-600">
              <li>
                <a
                  href="https://wa.me/56934428848?text=Hola!%20Quiero%20consultar%20sobre%20los%20productos%20de%20SocialPilot."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-stone-950 transition-colors"
                >
                  Soporte WhatsApp ↗
                </a>
              </li>
              <li>
                <Link href="/es/privacidad" className="hover:text-stone-950 transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/es/terminos" className="hover:text-stone-950 transition-colors">
                  Términos de uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-stone-300/80 pt-6 text-xs text-stone-500 sm:flex-row">
          <p>© {new Date().getFullYear()} SocialPilot by Santisoft. Todos los derechos reservados.</p>
          <p className="font-mono text-[11px]">
            Hecho para que dueños de negocios recuperen su tiempo.
          </p>
        </div>
      </div>
    </footer>
  );
}
