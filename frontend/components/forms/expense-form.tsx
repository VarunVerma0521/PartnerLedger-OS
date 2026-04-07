"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { createExpense, fetchPartners, type ApiError } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";

export function ExpenseForm() {
  const queryClient = useQueryClient();
  const partnersQuery = useQuery({
    queryKey: ["partners"],
    queryFn: fetchPartners,
  });

  const [amount, setAmount] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [partnerId, setPartnerId] = React.useState("");
  const [type, setType] = React.useState<"business" | "personal">("business");
  const [paymentSource, setPaymentSource] = React.useState<"cash" | "online">("cash");
  const [description, setDescription] = React.useState("");
  const [timestamp, setTimestamp] = React.useState(toLocalDateTimeInputValue());

  const handlePartnerChange = (value: string | null) => {
    setPartnerId(value ?? "");
  };

  const handleTypeChange = (value: string | null) => {
    if (value === "business" || value === "personal") {
      setType(value);
    }
  };

  const handlePaymentSourceChange = (value: string | null) => {
    if (value === "cash" || value === "online") {
      setPaymentSource(value);
    }
  };

  React.useEffect(() => {
    if (!partnerId && partnersQuery.data?.[0]?.id) {
      setPartnerId(partnersQuery.data[0].id);
    }
  }, [partnerId, partnersQuery.data]);

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success("Expense recorded", {
        description: "The backend will process wallet, settlement, and alert changes automatically.",
      });
      setAmount("");
      setCategory("");
      setType("business");
      setPaymentSource("cash");
      setDescription("");
      setTimestamp(toLocalDateTimeInputValue());
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["settlements"] }),
      ]);
    },
    onError: (error: ApiError) => {
      toast.error("Unable to save expense", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    createExpenseMutation.mutate({
      amount: Number(amount),
      category,
      paid_by: partnerId,
      type,
      payment_source: paymentSource,
      description: description || undefined,
      timestamp: toIsoFromLocalDateTime(timestamp),
    });
  };

  return (
    <Card className="border-0 bg-white/84 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle>Add an expense</CardTitle>
        <CardDescription>
          Track business or personal spend while the backend engines update balances and alerts in the background.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="300"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Input
              id="expense-category"
              placeholder="Inventory"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Paid by</Label>
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
            <Label>Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment source</Label>
            <Select value={paymentSource} onValueChange={handlePaymentSourceChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-time">Timestamp</Label>
            <Input
              id="expense-time"
              type="datetime-local"
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="expense-description">Description</Label>
            <Textarea
              id="expense-description"
              placeholder="Purchased raw materials"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              size="lg"
              className="bg-[#14312c] text-white hover:bg-[#0f2622]"
              disabled={createExpenseMutation.isPending || partnersQuery.isLoading || !partnerId}
            >
              <Save className="size-4" />
              {createExpenseMutation.isPending ? "Saving expense..." : "Save expense"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
