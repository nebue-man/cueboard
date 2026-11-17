import { TableType } from "@/types";

const labels: Record<TableType, string> = {
  POOL:      "Pool",
  SNOOKER:   "Snooker",
  BILLIARDS: "Billiards",
  CAROM:     "Carom",
};

const colors: Record<TableType, string> = {
  POOL:      "bg-blue-100 text-blue-800",
  SNOOKER:   "bg-green-100 text-green-800",
  BILLIARDS: "bg-purple-100 text-purple-800",
  CAROM:     "bg-amber-100 text-amber-800",
};

export function TableTypeBadge({ type }: { type: TableType }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[type]}`}>
      {labels[type]}
    </span>
  );
}
