import type { ReactNode } from "react";
import { bricolage, inter } from "@/components/marketing/fonts";
import "../admin.css";

/** Wrapper that gives an admin screen the Jibun look (fonts, warm colours, rounded shapes). */
export function AdminFrame({ children }: { children: ReactNode }) {
  return <div className={`adm ${bricolage.variable} ${inter.variable}`}>{children}</div>;
}
