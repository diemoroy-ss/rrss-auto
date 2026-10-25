import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface FidelizaLogoProps {
  height?: number;
  width?: number;
  href?: string;
  className?: string;
  priority?: boolean;
}

export default function FidelizaLogo({
  height = 44,
  width = 210,
  href,
  className = "",
  priority = false,
}: FidelizaLogoProps) {
  const image = (
    <div className={`inline-flex items-center ${className}`.trim()}>
      <Image
        src="/fideliza-logo.svg"
        alt="Fideliza by SocialPilot"
        width={width}
        height={height}
        priority={priority}
        className="w-auto select-none"
        style={{ height: `${height}px` }}
      />
    </div>
  );

  if (href) {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return (
        <a href={href} className="inline-block hover:opacity-95 transition-opacity">
          {image}
        </a>
      );
    }
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
        {image}
      </Link>
    );
  }

  return image;
}
