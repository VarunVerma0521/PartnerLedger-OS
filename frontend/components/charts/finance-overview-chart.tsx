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

type FinanceOverviewChartProps = {
  totalSales: number;
  totalExpenses: number;
};

export function FinanceOverviewChart({
  totalSales,
  totalExpenses,
}: FinanceOverviewChartProps) {
  const formatChartValue = (
    value: number | string | readonly (number | string)[] | undefined,
  ) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return formatCurrency(Number(normalized ?? 0));
  };

  const data = [
    {
      name: "Revenue",
      value: totalSales,
      fill: "var(--color-chart-2)",
    },
    {
      name: "Spend",
      value: totalExpenses,
      fill: "var(--color-chart-1)",
    },
  ];

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={44}>
          <CartesianGrid vertical={false} stroke="rgba(20,49,44,0.08)" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatChartValue}
            width={88}
          />
          <Tooltip
            cursor={{ fill: "rgba(20,49,44,0.06)" }}
            formatter={(value) => formatChartValue(value)}
          />
          <Bar dataKey="value" radius={[14, 14, 6, 6]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
