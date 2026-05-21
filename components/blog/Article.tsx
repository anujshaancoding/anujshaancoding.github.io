import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// External links open in a new tab; internal ones navigate in place.
const components: Components = {
  a({ href, children }) {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
};

/** Renders post Markdown into styled prose (see `.article` in globals.css). */
export function Article({ children }: { children: string }) {
  return (
    <div className="article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
