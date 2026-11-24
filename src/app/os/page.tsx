import type { Metadata } from "next";
import { OsEntry } from "@/os/os-entry";

export const metadata: Metadata = {
  title: "JovanyOS | Jovany Morales del Ángel",
  description:
    "A desktop-style playground of Jovany Morales del Ángel's portfolio: draggable windows, project apps and a terminal with in-browser BM25 retrieval.",
  alternates: { canonical: "/os/" },
};

export default function OsPage() {
  return <OsEntry />;
}
