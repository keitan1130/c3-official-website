import { parse, postprocess, preprocess } from "micromark";
import { gfm } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { decodeString } from "micromark-util-decode-string";
import { parseFragment } from "parse5";

const attributes = { a: ["href"], img: ["src"], video: ["src", "poster"], audio: ["src"], source: ["src"], track: ["src"] };

// Replace only parsed URL spans, preserving Markdown formatting and code verbatim.
export function markdownAssetEdits(text, resolve) {
  const edits = [];
  const events = postprocess(parse({ extensions: [gfm(), math()] }).document().write(preprocess()(text, undefined, true)));
  for (const [kind, token] of events) {
    if (kind !== "enter") continue;
    const start = token.start.offset;
    const end = token.end.offset;
    const source = text.slice(start, end);
    if (token.type === "resourceDestinationString" || token.type === "definitionDestinationString") {
      const url = decodeString(source);
      const value = resolve(url);
      if (value !== url) edits.push({ start, end, value });
    } else if (token.type === "htmlFlow" || token.type === "htmlText") {
      const walk = (node) => {
        for (const attr of node.attrs ?? []) {
          if (!attributes[node.tagName]?.includes(attr.name)) continue;
          const value = resolve(attr.value, "html");
          const location = node.sourceCodeLocation?.attrs?.[attr.name];
          if (value !== attr.value && location) edits.push({ start: start + location.startOffset, end: start + location.endOffset, value: `${attr.name}="${value}"` });
        }
        for (const child of node.childNodes ?? []) walk(child);
      };
      walk(parseFragment(source, { sourceCodeLocationInfo: true }));
    }
  }
  return edits.sort((a, b) => a.start - b.start);
}
