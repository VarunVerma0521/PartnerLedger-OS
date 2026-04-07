"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Activity, Shield, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { getAccessToken } from "@/lib/auth";

const highlights = [
  {
    title: "Live Wallets",
    description: "Track cash and online partner balances as soon as sales and expenses are recorded.",
    icon: Activity,
  },
  {
    title: "Smart Settlements",
    description: "Use engine-generated debtor and creditor suggestions without spreadsheet clean-up.",
    icon: Shield,
  },
  {
    title: "Realtime Insights",
    description: "Surface profit drops, expense spikes, and operational alerts from the same operating view.",
    icon: Sparkles,
  },
];

export default function LoginPage() {
  const router = useRouter();

  React.useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(21,128,61,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(217,119,6,0.12),_transparent_34%),linear-gradient(180deg,#fbf8f1_0%,#f4efe3_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#14312c] px-6 py-8 text-white shadow-2xl sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.16),_transparent_26%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/70">
                Finance Command Center
              </p>
              <div className="space-y-4">
                <h1 className="max-w-2xl font-heading text-4xl leading-tight sm:text-5xl">
                  Turn partner finances into a live operating system.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-emerald-50/78 sm:text-lg">
                  PartnerLedger OS connects revenue, spend, settlements, and alerts in one
                  interface designed for fast daily decisions.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/12">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm leading-6 text-emerald-50/74">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-sm text-emerald-100/75">
              <span>Secure JWT sessions</span>
              <ArrowRight className="size-4" />
              <span>Realtime dashboard sync</span>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full">
            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  );
}
