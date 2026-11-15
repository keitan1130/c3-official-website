import { parse, postprocess, preprocess } from "micromark";
import { gfm } from "micromark-extension-gfm";
import { math } from "micromark-extension-math";
import { decodeString } from "micromark-util-decode-string";
import { normalizeIdentifier } from "micromark-util-normalize-identifier";
import { parseFragment } from "parse5";

const attributes = { a: ["href"], img: ["src"], video: ["src", "poster"], audio: ["src"], source: ["src"], track: ["src"] };

// Replace only parsed URL spans, preserving Markdown formatting and code verbatim.
export function markdownAssetEdits(text, resolve) {
  const edits = [];
  const events = postprocess(parse({ extensions: [gfm(), math()] }).document().write(preprocess()(text, undefined, true)));
  const imageReferences = new Set();
  const references = [];
  // Definitions can be shared by links and images, and can appear before use.
  for (const [kind, token] of events) {
    if (kind === "enter" && (token.type === "image" || token.type === "link")) references.push({ type: token.type });
    const reference = references.at(-1);
    if (!reference) continue;
    if (kind === "enter") {
      if (token.type === "labelText") reference.label = text.slice(token.start.offset, token.end.offset);
      if (token.type === "referenceString") reference.identifier = text.slice(token.start.offset, token.end.offset);
      if (token.type === "resource") reference.hasResource = true;
    } else if (token.type === "image" || token.type === "link") {
      references.pop();
      if (reference.type === "image" && !reference.hasResource) imageReferences.add(normalizeIdentifier(reference.identifier ?? reference.label ?? ""));
    }
  }
  const containers = [];
  let definition;
  for (const [kind, token] of events) {
    if (kind === "exit") {
      if (token.type === "image" || token.type === "link") containers.pop();
      continue;
    }
    if (token.type === "image" || token.type === "link") containers.push(token.type);
    const start = token.start.offset;
    const end = token.end.offset;
    const source = text.slice(start, end);
    if (token.type === "definitionLabelString") definition = normalizeIdentifier(source);
    if (token.type === "resourceDestinationString" || token.type === "definitionDestinationString") {
      const url = decodeString(source);
      const isImage = token.type === "definitionDestinationString" ? imageReferences.has(definition) : containers.at(-1) === "image";
      const value = resolve(url, "markdown", isImage ? "media" : "link");
      if (value !== url) edits.push({ start, end, value });
    } else if (token.type === "htmlFlow" || token.type === "htmlText") {
      const walk = (node) => {
        for (const attr of node.attrs ?? []) {
          if (!attributes[node.tagName]?.includes(attr.name)) continue;
          const value = resolve(attr.value, "html", node.tagName === "a" ? "link" : "media");
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
