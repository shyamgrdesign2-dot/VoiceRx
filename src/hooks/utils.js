/**
 * Hand-rolled `cn` — class-name composer. Replaces clsx + tailwind-merge.
 *
 *   cn("p-2", isActive && "bg-blue-500", { "text-white": ok })
 *
 * Behaviour:
 *   1. Flattens arrays / falsy values / objects (clsx-equivalent).
 *   2. De-duplicates conflicting Tailwind utility classes so that the
 *      LAST-PASSED wins (`cn("p-2", "p-4")` → `"p-4"`). Covers the
 *      common conflict groups; twMerge's full table is large but the
 *      project mostly hits these.
 */

const CONFLICT_GROUPS = [
  // Layout / box
  /^p-/, /^px-/, /^py-/, /^pt-/, /^pr-/, /^pb-/, /^pl-/, /^ps-/, /^pe-/,
  /^m-/, /^mx-/, /^my-/, /^mt-/, /^mr-/, /^mb-/, /^ml-/, /^ms-/, /^me-/,
  /^w-/, /^min-w-/, /^max-w-/, /^h-/, /^min-h-/, /^max-h-/,
  /^gap-/, /^gap-x-/, /^gap-y-/, /^space-x-/, /^space-y-/,
  // Display / position
  /^block$|^inline-block$|^inline$|^flex$|^inline-flex$|^grid$|^inline-grid$|^hidden$|^contents$/,
  /^static$|^fixed$|^absolute$|^relative$|^sticky$/,
  /^top-/, /^right-/, /^bottom-/, /^left-/, /^inset-/, /^inset-x-/, /^inset-y-/,
  // Flex / grid
  /^flex-/, /^items-/, /^justify-/, /^content-/, /^self-/, /^place-/, /^order-/, /^col-/, /^row-/,
  // Typography
  /^text-(?:xs|sm|base|lg|xl|\d)/, /^text-/,
  /^font-/, /^leading-/, /^tracking-/,
  // Color (text / bg / border)
  /^bg-/, /^border$|^border-\d/, /^border-(?:t|r|b|l|x|y|s|e)-/, /^border-(?:transparent|current|inherit|black|white|tp-)/,
  // Borders / rounded / shadow
  /^rounded$|^rounded-/, /^shadow$|^shadow-/, /^ring$|^ring-/, /^outline$|^outline-/,
  // Effects
  /^opacity-/, /^transition$|^transition-/, /^duration-/, /^ease-/,
  /^z-/, /^cursor-/, /^select-/, /^pointer-events-/, /^overflow$|^overflow-/,
];

function classGroup(token) {
  for (const re of CONFLICT_GROUPS) {
    if (re.test(token)) return re.source;
  }
  return null;
}

function flatten(input, out) {
  if (input === null || input === undefined || input === false || input === true) return;
  if (typeof input === "string" || typeof input === "number") {
    out.push(String(input));
    return;
  }
  if (Array.isArray(input)) {
    for (const x of input) flatten(x, out);
    return;
  }
  if (typeof input === "object") {
    for (const key in input) {
      if (input[key]) out.push(key);
    }
  }
}

export function cn(...inputs) {
  const parts = [];
  flatten(inputs, parts);
  // Split on whitespace so multi-class strings ("p-2 m-4") resolve as
  // separate tokens for conflict resolution.
  const tokens = parts.flatMap((s) => s.split(/\s+/)).filter(Boolean);

  // Resolve conflicts: last token in a group wins. Tokens with no
  // matching group pass through (e.g. component module class names,
  // arbitrary user classes).
  const seen = new Map(); // group -> last token
  const passthrough = [];
  for (const tok of tokens) {
    const group = classGroup(tok);
    if (group) {
      seen.set(group, tok);
    } else {
      passthrough.push(tok);
    }
  }
  return [...passthrough, ...seen.values()].join(" ");
}

export function safeClipboardWrite(text) {
  try {
    const result = navigator.clipboard?.writeText(text);
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch {
    /* permission denied (synchronous throw) */
  }
}
