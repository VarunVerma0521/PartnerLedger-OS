"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ExpenseForm } from "@/components/forms/expense-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <AppShell
      title="Expense intake"
      description="Capture outgoing business and personal spend with the same live event pipeline used by the backend."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-0 bg-[#14312c] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="font-heading text-3xl">Expense processing</CardTitle>
            <CardDescription className="text-emerald-50/75">
              Expense writes stay focused: persist the transaction, emit `expense.created`,
              and let the engines handle the rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-emerald-50/80">
            <p>1. Save the expense against the selected partner.</p>
            <p>2. Wallet Engine debits the correct balance source.</p>
            <p>3. Alerts and insights react to overspending, loss, and spike patterns.</p>
            <p>4. Frontend queries refresh when the backend emits realtime updates.</p>
          </CardContent>
        </Card>

        <ExpenseForm />
      </div>
    </AppShell>
  );
}
