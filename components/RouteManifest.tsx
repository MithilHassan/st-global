const NODES = [
  { code: "DAC", label: "Dhaka HQ & Airport", detail: "Air export / import" },
  { code: "CGP", label: "Chittagong Port", detail: "Ocean / CFS operations" },
  { code: "GLB", label: "Global network", detail: "11 airlines · 12 ocean carriers" },
];

export default function RouteManifest({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center">
      {NODES.map((n, i) => (
        <div key={n.code} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-start">
            <span
              className={`font-mono text-[11px] tracking-widest ${
                dark ? "text-royalLight" : "text-royal"
              }`}
            >
              {n.code}
            </span>
            <span
              className={`mt-1 font-display text-sm font-medium ${
                dark ? "text-paper" : "text-ink"
              }`}
            >
              {n.label}
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-wide ${
                dark ? "text-paper/50" : "text-ink/50"
              }`}
            >
              {n.detail}
            </span>
          </div>
          {i < NODES.length - 1 && (
            <div
              className={`mx-4 hidden h-[2px] flex-1 sm:block ${
                dark ? "route-line-dark" : "route-line"
              }`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
