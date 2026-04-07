"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SaleForm } from "@/components/forms/sale-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SalesPage() {
  return (
    <AppShell
      title="Revenue intake"
      description="Record incoming sales and let the backend event system push balance and settlement changes automatically."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-0 bg-[#14312c] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="font-heading text-3xl">Sales entry flow</CardTitle>
            <CardDescription className="text-emerald-50/75">
              A sale write triggers `sale.created`, which fans out to wallet, settlement,
              insight, alert, and websocket layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-emerald-50/80">
            <p>1. Save the transaction through the backend sales API.</p>
            <p>2. Wallet Engine credits the partner wallet based on payment mode.</p>
            <p>3. Settlement Engine recalculates creditor and debtor positions.</p>
            <p>4. The dashboard refreshes over websocket events.</p>
          </CardContent>
        </Card>

        <SaleForm />
      </div>
    </AppShell>
  );
}
