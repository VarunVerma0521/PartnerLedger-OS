"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type PartnerBalanceChartProps = {
  partners: Array<{
    id: string;
    name: string;
    wallet_balance: number;
  }>;
};

export function PartnerBalanceChart({ partners }: PartnerBalanceChartProps) {
  const formatChartValue = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return formatCurrency(Number(normalized ?? 0));
  };

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={partners}>
          <CartesianGrid vertical={false} stroke="rgba(20,49,44,0.08)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={partners.length > 3 ? -18 : 0}
            textAnchor={partners.length > 3 ? "end" : "middle"}
            height={partners.length > 3 ? 56 : 30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={88}
            tickFormatter={formatChartValue}
          />
          <Tooltip
            formatter={(value) => formatChartValue(value)}
            cursor={{ fill: "rgba(20,49,44,0.06)" }}
          />
          <Bar
            dataKey="wallet_balance"
            fill="var(--color-chart-3)"
            radius={[14, 14, 6, 6]}
            barSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
