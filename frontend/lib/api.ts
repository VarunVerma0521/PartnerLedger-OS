import { getAccessToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "ADMIN" | "PARTNER" | "VIEWER";
    partnerId: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
};

export type PartnerOption = {
  id: string;
  name: string;
  ownership_percentage: number;
  created_at: string;
  wallet: {
    cash_balance: number;
    online_balance: number;
    total_balance: number;
  };
};

export type DashboardData = {
  total_cash: number;
  total_online: number;
  total_sales: number;
  total_expenses: number;
  profit: number;
  partners: Array<{
    id: string;
    name: string;
    wallet_balance: number;
    ownership_percentage: number;
  }>;
  recent_transactions: {
    sales: Array<{
      id: string;
      amount: number;
      payment_mode: "cash" | "online";
      received_by: string;
      timestamp: string;
    }>;
    expenses: Array<{
      id: string;
      amount: number;
      category: string;
      paid_by: string;
      type: "business" | "personal";
      payment_source: "cash" | "online";
      description: string | null;
      timestamp: string;
    }>;
  };
};

export type SettlementData = {
  settlements: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
};

export type CreateSalePayload = {
  amount: number;
  payment_mode: "cash" | "online";
  received_by: string;
  timestamp: string;
};

export type CreateExpensePayload = {
  amount: number;
  category: string;
  paid_by: string;
  type: "business" | "personal";
  payment_source: "cash" | "online";
  description?: string;
  timestamp: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    payload.message
  ) {
    const { message } = payload as { message?: string | string[] };

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token = getAccessToken() } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? ((await response.json()) as unknown)
    : null;

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, "Request failed"),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    token: null,
  });
}

export async function fetchDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>("/dashboard");
}

export async function fetchPartners(): Promise<PartnerOption[]> {
  return apiRequest<PartnerOption[]>("/partners");
}

export async function createSale(payload: CreateSalePayload) {
  return apiRequest("/sales", {
    method: "POST",
    body: payload,
  });
}

export async function createExpense(payload: CreateExpensePayload) {
  return apiRequest("/expenses", {
    method: "POST",
    body: payload,
  });
}

export async function fetchSettlements(): Promise<SettlementData> {
  return apiRequest<SettlementData>("/settlements");
}
