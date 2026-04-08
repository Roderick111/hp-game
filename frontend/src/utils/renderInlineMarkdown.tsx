import React from "react";

/**
 * Render inline markdown (bold/italic) as React elements.
 * Supports **bold**, *italic*, and ***bold+italic***.
 */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match **bold**, *italic*, or ***bold+italic***
  const regex = /(\*{1,3})((?:(?!\1).)+?)\1/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const stars = match[1];
    const content = match[2];

    if (stars === "***") {
      parts.push(
        <strong key={match.index}>
          <em>{content}</em>
        </strong>,
      );
    } else if (stars === "**") {
      parts.push(<strong key={match.index}>{content}</strong>);
    } else {
      parts.push(<em key={match.index}>{content}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
