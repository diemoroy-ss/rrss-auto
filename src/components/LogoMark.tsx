import React, { useId } from "react";

export interface LogoMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  color?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeWidth?: number | string;
  fill?: string;
  animated?: boolean;
}

export default function LogoMark({
  size,
  width = size || 32,
  height = size || 32,
  color = "#FF6B00",
  fill,
  strokeWidth,
  className = "",
  animated = false,
  ...props
}: LogoMarkProps) {
  const rawId = useId();
  const gradId = `santisoft-grad-${rawId.replace(/:/g, "")}`;
  const useDefaultGrad = !fill && color.toUpperCase() === "#FF6B00";
  const paint = useDefaultGrad ? `url(#${gradId})` : fill || color;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`santisoft-isotype-svg ${animated ? "flow-logo-anim" : ""} ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      {useDefaultGrad && (
        <defs>
          <linearGradient id={gradId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFB000" />
            <stop offset="0.5" stopColor="#FF6B00" />
            <stop offset="1" stopColor="#FF3D00" />
          </linearGradient>
        </defs>
      )}
      <ellipse
        cx="32"
        cy="32"
        rx="29.5"
        ry="11"
        transform="rotate(-30 32 32)"
        stroke={paint}
        strokeWidth="2.6"
        opacity="0.88"
      />
      <path
        d="M44 17H24L17 24.5L24 32H40L47 39.5L40 47H20"
        stroke={paint}
        strokeWidth={strokeWidth || 6.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="57.2" cy="17.5" r="4.3" fill={paint} />
    </svg>
  );
}
