import React from "react";
import Link from "next/link";
import Image from "next/image";

export interface SocialPilotLogoProps {
  height?: number;
  width?: number;
  variant?: "dark" | "light";
  href?: string;
  className?: string;
  target?: string;
  rel?: string;
  priority?: boolean;
}

export default function SocialPilotLogo({
  height = 44,
  width = 210,
  variant = "dark",
  href,
  className = "",
  target,
  rel,
  priority = false,
}: SocialPilotLogoProps) {
  const src = variant === "light" 
    ? "/socialpilot-logo-clean-light.svg" 
    : "/socialpilot-logo-clean.svg";

  const image = (
    <div className={`inline-flex items-center ${className}`.trim()}>
      <Image
        src={src}
        alt="SocialPilot by Santisoft"
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
        <a href={href} target={target} rel={rel || (target === "_blank" ? "noopener noreferrer" : undefined)} className="inline-block hover:opacity-95 transition-opacity">
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
