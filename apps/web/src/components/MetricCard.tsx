export const MetricCard = ({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warning";
}) => (
  <div className={`metric-card metric-card--${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

