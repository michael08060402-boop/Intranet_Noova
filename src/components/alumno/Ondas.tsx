import { useId } from "react";

export default function Ondas({ className }: { className: string }) {
  const id = `ondas${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg className={className} viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-relleno`} x1="0" x2="1">
          <stop offset="0" stopColor="#1fa3d8" stopOpacity=".3" />
          <stop offset=".35" stopColor="#1fa3d8" stopOpacity=".04" />
          <stop offset=".65" stopColor="#1fa3d8" stopOpacity=".04" />
          <stop offset="1" stopColor="#1fa3d8" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id={`${id}-fondo`} x1="0" x2="1">
          <stop offset="0" stopColor="#3fd0f5" stopOpacity=".12" />
          <stop offset=".5" stopColor="#3fd0f5" stopOpacity=".02" />
          <stop offset="1" stopColor="#3fd0f5" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id={`${id}-linea`} x1="0" x2="1">
          <stop offset="0" stopColor="#3fd0f5" stopOpacity=".35" />
          <stop offset=".4" stopColor="#3fd0f5" stopOpacity=".06" />
          <stop offset=".6" stopColor="#3fd0f5" stopOpacity=".06" />
          <stop offset="1" stopColor="#3fd0f5" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id}-fondo)`} d="M0 84C170 72 300 118 470 112S760 118 920 124 1220 104 1440 92V140H0Z" />
      <path fill={`url(#${id}-relleno)`} d="M0 30C150 28 260 92 400 116S640 108 760 112 1020 120 1150 96 1340 36 1440 32V140H0Z" />
      <path fill="none" stroke={`url(#${id}-linea)`} strokeWidth="1" vectorEffect="non-scaling-stroke" d="M0 30C150 28 260 92 400 116S640 108 760 112 1020 120 1150 96 1340 36 1440 32" />
    </svg>
  );
}
