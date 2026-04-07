"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, ReceiptText, WalletCards, HandCoins } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  clearAuthSession,
  getStoredAuthSession,
  type StoredAuthSession,
} from "@/lib/auth";
import { RealtimeSync } from "@/components/providers/realtime-sync";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/sales",
    label: "Sales",
    icon: WalletCards,
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: ReceiptText,
  },
  {
    href: "/settlements",
    label: "Settlements",
    icon: HandCoins,
  },
];

type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [session, setSession] = React.useState<StoredAuthSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);

  React.useEffect(() => {
    const storedSession = getStoredAuthSession();

    if (!storedSession?.accessToken) {
      router.replace("/login");
      return;
    }

    setSession(storedSession);
    setIsCheckingSession(false);
  }, [router]);

  const handleLogout = React.useCallback(() => {
    clearAuthSession();
    void queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(17,94,89,0.18),_transparent_40%),linear-gradient(180deg,#f7f3ea_0%,#f4efe3_100%)] px-6">
        <Card className="w-full max-w-md border-0 bg-white/80 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>Loading PartnerLedger OS</CardTitle>
            <CardDescription>
              Preparing your workspace and validating your session.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(21,128,61,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_32%),linear-gradient(180deg,#fbf8f1_0%,#f4efe3_100%)]">
      <RealtimeSync />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-0 bg-[#14312c] text-white shadow-2xl">
          <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
                PartnerLedger OS
              </p>
              <div>
                <h1 className="font-heading text-3xl leading-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-emerald-50/75 sm:text-base">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm sm:items-end">
              <div>
                <p className="font-medium">{session?.user.fullName}</p>
                <p className="text-emerald-100/70">{session?.user.role}</p>
              </div>
              <Button
                variant="secondary"
                className="bg-white text-[#14312c] hover:bg-white/90"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: isActive ? "default" : "outline", size: "lg" }),
                  "gap-2 rounded-full px-4",
                  isActive
                    ? "bg-[#14312c] text-white hover:bg-[#0f2622]"
                    : "border-[#14312c]/10 bg-white/70 text-[#14312c] hover:bg-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
