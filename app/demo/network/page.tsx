import type { Metadata } from "next";
import { NetworkDemo } from "@/components/demo/NetworkDemo";

export const metadata: Metadata = {
  title: "Network Graph — Live Demo · Anuj Kumar",
  description:
    "Upload an edge list and explore it with a live force-directed network graph — draggable nodes, hand-rolled physics, no chart libraries.",
};

export default function NetworkDemoPage() {
  return <NetworkDemo />;
}
