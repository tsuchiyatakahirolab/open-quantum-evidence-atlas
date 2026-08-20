import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find the Broken Evidence Link | Open Quantum Evidence Atlas",
  description: "Audit a research portfolio, inspect exact OpenAIRE source records and export the identifiers to fix.",
};

export default function AuditLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
