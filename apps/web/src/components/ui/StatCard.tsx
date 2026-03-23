import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function StatCard({ label, value, valueClassName }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn("text-xl font-semibold", valueClassName)}>{value}</p>
    </div>
  );
}
