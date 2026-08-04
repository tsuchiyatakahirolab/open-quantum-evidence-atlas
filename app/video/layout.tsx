import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "119-second walkthrough | Open Quantum Evidence Atlas",
  description: "A captioned walkthrough of the OpenAIRE Evidence Chain Auditor, its 645-record result and the Alien MCP pagination diagnostic.",
};

export default function VideoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
