"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000/realtime";

export function RealtimeSync() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("dashboard.update", () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["settlements"] }),
      ]);
    });

    socket.on("settlement.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["settlements"] });
    });

    socket.on("alert.triggered", (payload: { title?: string; message?: string }) => {
      if (payload?.title) {
        toast.warning(payload.title, {
          description: payload.message,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return null;
}
