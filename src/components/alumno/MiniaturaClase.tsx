import Image from "next/image";
import type { ReactNode } from "react";
import "./MiniaturaClase.css";

export default function MiniaturaClase({ miniatura, className, children }: { miniatura?: string; className: string; children?: ReactNode }) {
  return (
    <span className={`${className} miniatura-clase`}>
      {miniatura && <Image className="miniatura-clase__imagen" src={miniatura} alt="" fill sizes="110px" unoptimized />}
      <span className="miniatura-clase__contenido">{children}</span>
    </span>
  );
}
