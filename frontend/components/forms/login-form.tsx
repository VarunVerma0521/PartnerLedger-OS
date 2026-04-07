"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type ApiError } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      saveAuthSession({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role,
          partnerId: data.user.partnerId,
        },
      });

      toast.success("Signed in successfully", {
        description: `Welcome back, ${data.user.fullName}.`,
      });
      router.replace("/dashboard");
    },
    onError: (error: ApiError) => {
      toast.error("Unable to sign in", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({
      email,
      password,
    });
  };

  return (
    <Card className="border-0 bg-white/88 shadow-2xl backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#14312c] text-white shadow-lg">
          <ShieldCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Sign in to PartnerLedger OS</CardTitle>
          <CardDescription>
            Use your backend account to access live finance operations and settlement data.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-[#14312c] text-white hover:bg-[#0f2622]"
            disabled={loginMutation.isPending}
          >
            <LogIn className="size-4" />
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
