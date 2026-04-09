"use client";

import Link from "next/link";
import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaksImport from "remark-breaks";
import hljs from "highlight.js/lib/common";
import type { Pluggable, PluggableList } from "unified";

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // ignore
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "true");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } catch {
    // ignore
  }
}

function preserveSoftBreaksOutsideFences(markdown: string) {
  // Some markdown renderers treat a single newline as a space (soft break).
  // Convert soft breaks to hard breaks (`"  \n"`) outside fenced code blocks
  // so multiline posts render as the author typed them.
  const lines = String(markdown ?? "").split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  let fenceMarker: "```" | "~~~" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trimStart();

    if (!inFence && (trimmed.startsWith("```") || trimmed.startsWith("~~~"))) {
      inFence = true;
      fenceMarker = trimmed.startsWith("```") ? "```" : "~~~";
      out.push(line);
      continue;
    }
    if (inFence && fenceMarker && trimmed.startsWith(fenceMarker)) {
      inFence = false;
      fenceMarker = null;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    const next = lines[i + 1];
    const nextIsBlank = next == null ? true : next.trim().length === 0;

    // Preserve intentional blank lines as paragraph breaks.
    if (line.trim().length === 0) {
      out.push(line);
      continue;
    }

    // Add a hard-break marker on non-blank lines that are followed by another non-blank line.
    // This keeps list items and normal text readable without forcing extra paragraphs.
    if (!nextIsBlank && i < lines.length - 1) {
      out.push(`${line}  `);
    } else {
      out.push(line);
    }
  }

  return out.join("\n");
}

export default function MarkdownContent({
  source,
  colorMode,
}: {
  source: string;
  colorMode: "dark" | "light";
}) {
  function getDefaultExport(value: unknown): unknown {
    if (typeof value === "function") return value;
    if (typeof value === "object" && value !== null && "default" in value) {
      return (value as { default: unknown }).default;
    }
    return value;
  }

  // Some builds expose it as `default` (CJS/ESM interop). Normalize it.
  const remarkBreaks = getDefaultExport(remarkBreaksImport) as Pluggable;
  const remarkPlugins: PluggableList = [remarkGfm, remarkBreaks];
  const normalizedSource = preserveSoftBreaksOutsideFences(source);

  const components = useMemo(
    () => ({
      a: ({
        href,
        children,
      }: {
        href?: string;
        children?: React.ReactNode;
      }) => {
        const h = typeof href === "string" ? href : "";
        if (h.startsWith("/")) return <Link href={h}>{children}</Link>;
        return (
          <a href={h} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
      pre: ({ children }: { children?: React.ReactNode }) => {
        const codeEl = React.Children.toArray(children).find((c) =>
          React.isValidElement(c),
        ) as React.ReactElement | undefined;

        type CodeElementProps = {
          className?: string;
          children?: React.ReactNode;
        };
        const codeProps = (codeEl?.props ?? {}) as CodeElementProps;
        const codeClassName = String(codeProps.className ?? "");
        const raw = React.Children.toArray(codeProps.children)
          .map((c) => (typeof c === "string" ? c : ""))
          .join("")
          .replace(/\n$/, "");

        if (!raw) return <pre>{children}</pre>;

        const match = /language-([a-z0-9_-]+)/i.exec(codeClassName);
        const explicitLang = match?.[1]?.toLowerCase();
        const result =
          explicitLang && hljs.getLanguage(explicitLang)
            ? hljs.highlight(raw, { language: explicitLang })
            : hljs.highlightAuto(raw);
        const label = String(result.language ?? explicitLang ?? "text");

        return (
          <div className="my-3 rounded-md border border-base-300 bg-base-100 overflow-hidden">
            <div className="code-toolbar flex items-center justify-between gap-3 px-3 py-2 text-xs border-b border-base-300 bg-base-300">
              <span className="font-mono opacity-70">{label}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={async () => {
                  await copyToClipboard(raw);
                }}
                aria-label="Copy code"
              >
                Copy
              </button>
            </div>
            <pre className="m-0 p-3 whitespace-pre-wrap break-words overflow-x-hidden bg-base-100">
              <code
                className={`hljs ${codeClassName}`.trim()}
                dangerouslySetInnerHTML={{ __html: result.value }}
              />
            </pre>
          </div>
        );
      },
      code: ({
        className,
        children,
      }: {
        className?: string;
        children?: React.ReactNode;
      }) =>
        (() => {
          const text = React.Children.toArray(children)
            .map((c) => (typeof c === "string" ? c : ""))
            .join("");

          // Block code is handled by `pre`. Inline code stays inline unless it looks like a snippet.
          const looksLikeBlock =
            text.includes("\n") ||
            String(className ?? "").includes("language-");

          if (looksLikeBlock)
            return <code className={className}>{children}</code>;

          const shouldHighlight = text.length >= 24 && /[;{}=]/.test(text);
          if (!shouldHighlight)
            return <code className={className}>{children}</code>;

          const result = hljs.highlightAuto(text);
          const label = String(result.language ?? "text");

          return (
            <span className="block my-2 rounded-md border border-base-300 bg-base-100 overflow-hidden">
              <span className="code-toolbar flex items-center justify-between gap-3 px-3 py-2 text-xs border-b border-base-300 bg-base-300">
                <span className="font-mono opacity-70">{label}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={async () => {
                    await copyToClipboard(text);
                  }}
                  aria-label="Copy code"
                >
                  Copy
                </button>
              </span>
              <code
                className={`hljs block px-3 py-2 whitespace-pre-wrap break-words overflow-hidden bg-base-100 ${className ?? ""}`.trim()}
                dangerouslySetInnerHTML={{ __html: result.value }}
              />
            </span>
          );
        })(),
    }),
    [],
  );

  return (
    <div
      data-color-mode={colorMode}
      className="wmde-markdown rounded-xl !bg-transparent !p-0"
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {normalizedSource}
      </ReactMarkdown>
    </div>
  );
}
