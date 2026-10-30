const dt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
export const formatDateTime = (v) => (v ? dt.format(new Date(v)) : '');

const TOOL_LABELS = {
  get_ticket_conversation: 'Read the ticket conversation',
  get_environment_details: 'Read the environment details',
  search_documentation: 'Searched the documentation',
  get_document_passage: 'Opened a documentation passage',
};
export const toolLabel = (tool) => TOOL_LABELS[tool] ?? tool;

export const pageRange = (p) => (p.pageEnd && p.pageEnd !== p.pageStart ? `${p.pageStart}\u2013${p.pageEnd}` : `${p.pageStart}`);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Split passage text into [before, match, after] so the cited quote can be highlighted despite whitespace differences. */
export function splitHighlight(content, quote) {
  if (!quote) return null;
  const words = quote.trim().split(/\s+/).filter(Boolean).map(escapeRe);
  if (!words.length) return null;
  const m = new RegExp(words.join('\\s+'), 'i').exec(content);
  if (!m) return null;
  return [content.slice(0, m.index), m[0], content.slice(m.index + m[0].length)];
}
