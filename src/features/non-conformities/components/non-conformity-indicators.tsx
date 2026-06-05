type NonConformityIndicatorsProps = {
  indicators: {
    critical: number;
    inProgress: number;
    open: number;
    resolved: number;
  };
};

export function NonConformityIndicators({
  indicators,
}: NonConformityIndicatorsProps) {
  const items = [
    { label: "Abertas", value: indicators.open },
    { label: "Em andamento", value: indicators.inProgress },
    { label: "Resolvidas", value: indicators.resolved },
    { label: "Criticas", value: indicators.critical },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div className="rounded-lg border bg-card p-4 shadow-sm" key={item.label}>
          <p className="text-sm font-medium text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
