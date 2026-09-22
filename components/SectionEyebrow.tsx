export default function SectionEyebrow({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-[0.25em] ${
        dark ? "text-royalLight" : "text-teal"
      }`}
    >
      {children}
    </span>
  );
}
