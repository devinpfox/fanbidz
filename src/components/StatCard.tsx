// components/StatCard.tsx
export default function StatCard({
    label,
    value,
    delta,
    prefix = "",
  }: {
    label: string;
    value: string;
    delta?: number; // percent
    prefix?: string;
  }) {
    const up = (delta ?? 0) >= 0;
    const deltaText =
      delta == null ? "" : `${up ? "+" : ""}${delta.toFixed(0)}%`;
  
    return (
      <div className="rounded-2xl border p-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-3xl font-bold mt-1">{prefix}{value}</p>
        {delta != null && (
          <p className={`text-sm mt-1 ${up ? "text-green-600" : "text-rose-600"}`}>
            {deltaText} this period
          </p>
        )}
      </div>
    );
  }
  