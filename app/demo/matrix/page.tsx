import type { Metadata } from "next";
import { MatrixDemo } from "@/components/demo/MatrixDemo";

export const metadata: Metadata = {
  title: "Matrix Data Table — Live Demo · Anuj Kumar",
  description:
    "Upload any spreadsheet and read it as a dense, sortable matrix with in-cell bars, heat-maps and row trends — no chart libraries.",
};

export default function MatrixDemoPage() {
  return <MatrixDemo />;
}
