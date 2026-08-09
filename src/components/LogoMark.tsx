import React from "react";

export interface LogoMarkProps extends React.SVGAttributes<SVGSVGElement> {
  size?: number | string;
  color?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function LogoMark({
  size,
  width = size || 32,
  height = size || 32,
  color = "#E5300A",
  fill,
  className = "",
  ...props
}: LogoMarkProps) {
  const fillColor = fill || color;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`santisoft-isotype-svg ${className}`.trim()}
      aria-hidden="true"
      {...props}
    >
      <rect x="2.5" y="14" width="4.5" height="14" rx="2.25" fill={fillColor} />
      <rect x="9.5" y="4" width="4.5" height="24" rx="2.25" fill={fillColor} />
      <rect x="16.5" y="10" width="4.5" height="18" rx="2.25" fill={fillColor} />
      <rect x="23.5" y="6" width="4.5" height="22" rx="2.25" fill={fillColor} />
    </svg>
  );
}
