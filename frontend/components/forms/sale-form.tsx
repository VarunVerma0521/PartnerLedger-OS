"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { createSale, fetchPartners, type ApiError } from "@/lib/api";
import { toIsoFromLocalDateTime, toLocalDateTimeInputValue } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SaleForm() {
  const queryClient = useQueryClient();
  const partnersQuery = useQuery({
    queryKey: ["partners"],
    queryFn: fetchPartners,
  });

  const [amount, setAmount] = React.useState("");
  const [paymentMode, setPaymentMode] = React.useState<"cash" | "online">("cash");
  const [partnerId, setPartnerId] = React.useState("");
  const [timestamp, setTimestamp] = React.useState(toLocalDateTimeInputValue());

  const handlePaymentModeChange = (value: string | null) => {
    if (value === "cash" || value === "online") {
      setPaymentMode(value);
    }
  };

  const handlePartnerChange = (value: string | null) => {
    setPartnerId(value ?? "");
  };

  React.useEffect(() => {
    if (!partnerId && partnersQuery.data?.[0]?.id) {
      setPartnerId(partnersQuery.data[0].id);
    }
  }, [partnerId, partnersQuery.data]);

  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success("Sale recorded", {
        description: "The backend will update wallets and settlements automatically.",
      });
      setAmount("");
      setPaymentMode("cash");
      setTimestamp(toLocalDateTimeInputValue());
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["settlements"] }),
      ]);
    },
    onError: (error: ApiError) => {
      toast.error("Unable to save sale", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createSaleMutation.mutate({
      amount: Number(amount),
      payment_mode: paymentMode,
      received_by: partnerId,
      timestamp: toIsoFromLocalDateTime(timestamp),
    });
  };

  return (
    <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle>Add a sale</CardTitle>
        <CardDescription>
          Revenue entries flow into wallet, settlement, insight, and alert engines through the backend event bus.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="sale-amount">Amount</Label>
            <Input
              id="sale-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Payment mode</Label>
            <Select value={paymentMode} onValueChange={handlePaymentModeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Received by</Label>
            <Select
              value={partnerId}
              onValueChange={handlePartnerChange}
              disabled={partnersQuery.isLoading || !partnersQuery.data?.length}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {partnersQuery.data?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-time">Timestamp</Label>
            <Input
              id="sale-time"
              type="datetime-local"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="bg-[#14312c] text-white hover:bg-[#0f2622]"
              disabled={createSaleMutation.isPending || partnersQuery.isLoading || !partnerId}
            >
              <Save className="size-4" />
              {createSaleMutation.isPending ? "Saving sale..." : "Save sale"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
