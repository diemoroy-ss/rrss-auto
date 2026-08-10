import React from "react";

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
  strokeWidth = 16,
  className = "",
  animated = false,
  ...props
}: LogoMarkProps) {
  const strokeColor = fill || color;

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
      <path
        d="M 64 8 L 32 8 L 8 32 L 56 32 L 32 56 L 0 56"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="butt"
        strokeLinejoin="bevel"
      />
    </svg>
  );
}
