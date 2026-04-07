"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Landmark,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FinanceOverviewChart } from "@/components/charts/finance-overview-chart";
import { PartnerBalanceChart } from "@/components/charts/partner-balance-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchDashboard } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const metricIcons = [Banknote, Landmark, TrendingUp, ArrowDownRight, PiggyBank];

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const dashboard = dashboardQuery.data;

  return (
    <AppShell
      title="Realtime dashboard"
      description="Track cash, online balances, revenue, spend, and settlement posture from the same live workspace."
    >
      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="border-0 bg-white/75">
              <CardContent className="h-32 animate-pulse" />
            </Card>
          ))}
        </div>
      ) : dashboardQuery.isError || !dashboard ? (
        <Card className="border-0 bg-white/80">
          <CardHeader>
            <CardTitle>Unable to load dashboard</CardTitle>
            <CardDescription>
              The backend may be unavailable or your session may not have access to dashboard data.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Total Cash", dashboard.total_cash],
              ["Total Online", dashboard.total_online],
              ["Total Sales", dashboard.total_sales],
              ["Total Expenses", dashboard.total_expenses],
              ["Profit", dashboard.profit],
            ].map(([label, value], index) => {
              const Icon = metricIcons[index];

              return (
                <Card key={label} className="border-0 bg-white/84 shadow-lg backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-xs uppercase tracking-[0.25em]">
                        {label}
                      </CardDescription>
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-[#14312c]/8 text-[#14312c]">
                        <Icon className="size-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-heading text-3xl text-[#14312c]">
                      {formatCurrency(Number(value))}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Sales vs expenses</CardTitle>
                <CardDescription>
                  Current aggregate revenue and spend pulled from the backend dashboard API.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinanceOverviewChart
                  totalSales={dashboard.total_sales}
                  totalExpenses={dashboard.total_expenses}
                />
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Partner balances</CardTitle>
                <CardDescription>
                  Compare wallet balance distribution across active partners.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartnerBalanceChart partners={dashboard.partners} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Recent sales</CardTitle>
                <CardDescription>Latest incoming revenue transactions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.recent_transactions.sales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
                ) : (
                  dashboard.recent_transactions.sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between rounded-2xl border border-[#14312c]/8 bg-[#14312c]/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#14312c]">{formatCurrency(sale.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.payment_mode.toUpperCase()} • {formatDateTime(sale.timestamp)}
                        </p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <ArrowUpRight className="size-4" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
              <CardHeader>
                <CardTitle>Recent expenses</CardTitle>
                <CardDescription>Latest outgoing spending transactions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.recent_transactions.expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                ) : (
                  dashboard.recent_transactions.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-2xl border border-[#14312c]/8 bg-[#14312c]/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#14312c]">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} • {formatDateTime(expense.timestamp)}
                        </p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <ArrowDownRight className="size-4" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
