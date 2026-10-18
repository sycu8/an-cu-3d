import { Link } from "react-router";
import { parseBlogInline, parseBlogMarkdown, type BlogInline } from "../lib/blog-markdown";

function Inline({ source }: { source: string }) {
  const parts = parseBlogInline(source);
  return (
    <>
      {parts.map((part, index) => (
        <InlinePart key={index} part={part} />
      ))}
    </>
  );
}

function InlinePart({ part }: { part: BlogInline }) {
  if (part.type === "strong") return <strong>{part.text}</strong>;
  if (part.type === "link") return <Link to={part.href}>{part.text}</Link>;
  return <>{part.text}</>;
}

/** Renders the blog's small markdown subset. Unknown markup stays as text. */
export function BlogMarkdown({ source }: { source: string }) {
  const blocks = parseBlogMarkdown(source);
  return (
    <div className="prose">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 key={index}>
              <Inline source={block.text} />
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index}>
              <Inline source={block.text} />
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline source={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index}>
              <Inline source={block.text} />
            </blockquote>
          );
        }
        return (
          <p key={index}>
            <Inline source={block.text} />
          </p>
        );
      })}
    </div>
  );
}
