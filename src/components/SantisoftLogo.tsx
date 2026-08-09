import React from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";

export interface SantisoftLogoProps {
  markSize?: number | string;
  markColor?: string;
  textColor?: string;
  showSubText?: boolean;
  subText?: string;
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
}

export default function SantisoftLogo({
  markSize = 24,
  markColor = "#E5300A",
  textColor,
  showSubText = false,
  subText = "REDES & CONTENIDO",
  href,
  className = "",
  target,
  rel,
}: SantisoftLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-2 font-bold ${className}`.trim()}>
      <LogoMark size={markSize} color={markColor} />
      <span className="font-extrabold tracking-tight" style={{ color: textColor }}>
        SANTISOFT
      </span>
      {showSubText && subText && (
        <>
          <span className="text-slate-400 opacity-60 font-light mx-1">/</span>
          <span className="text-xs uppercase tracking-wider font-semibold text-orange-500">
            {subText}
          </span>
        </>
      )}
    </div>
  );

  if (href) {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return (
        <a
          href={href}
          target={target || "_blank"}
          rel={rel || "noopener noreferrer"}
          className="inline-flex items-center no-underline hover:opacity-90 transition-opacity"
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="inline-flex items-center no-underline hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
