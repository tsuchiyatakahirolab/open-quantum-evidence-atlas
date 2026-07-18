import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidence Chain Auditor | Open Quantum Evidence Atlas",
  description: "Re-run a denominator-complete OpenAIRE evidence audit, inspect research chains, export results and check project visibility live.",
};

export default function AuditLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
