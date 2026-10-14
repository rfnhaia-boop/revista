import ReactMarkdown from "react-markdown";

const ALLOWED = ["p", "h2", "h3", "strong", "em", "u", "del", "ul", "ol", "li", "blockquote", "a", "hr", "br", "code", "pre"];

/**
 * Renderizador seguro: HTML cru é descartado (skipHtml), só elementos da lista
 * aparecem e apenas links http(s)/mailto são aceitos.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      skipHtml
      allowedElements={ALLOWED}
      unwrapDisallowed
      components={{
        a: ({ href, children: c }) => (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
            {c}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
