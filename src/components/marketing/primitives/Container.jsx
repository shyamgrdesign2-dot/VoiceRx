// Container — every section's content column. Uses --section-w (or
// --section-w-wide via the `wide` prop). Centered with horizontal auto
// margins. Mirrors TP_website's pattern of using one shared width so
// every below-fold section visually aligns as one column.

export default function Container({
  children,
  wide = false,
  className = "",
  as: Tag = "div",
  style,
  ...rest
}) {
  const width = wide ? "var(--section-w-wide)" : "var(--section-w)";
  return (
    <Tag
      className={`mx-auto ${className}`.trim()}
      style={{ width, maxWidth: width, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
