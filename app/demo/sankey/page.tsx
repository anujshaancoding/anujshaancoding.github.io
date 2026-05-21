import type { Metadata } from "next";
import { SankeyDemo } from "@/components/demo/SankeyDemo";

export const metadata: Metadata = {
  title: "Sankey Flow Diagram — Live Demo · Anuj Kumar",
  description:
    "Upload your own CSV and watch an interactive Sankey diagram lay itself out — hand-rolled layout engine, no chart libraries.",
};

export default function SankeyDemoPage() {
  return <SankeyDemo />;
}
