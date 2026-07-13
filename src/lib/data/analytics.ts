import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type MonthlyCount = {
  month: string;
  count: number;
};

export type StatusBreakdown<S extends string> = {
  status: S;
  count: number;
  value: number;
};

export type AnalyticsData = {
  inquiriesByMonth: MonthlyCount[];
  quotesByStatus: StatusBreakdown<Enums<"quote_status">>[];
  ordersByStatus: StatusBreakdown<Enums<"order_status">>[];
  totals: {
    inquiries: number;
    quotes: number;
    orders: number;
    ordersValue: number;
    conversionRate: number | null;
  };
};

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function lastMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(date.toISOString().slice(0, 7));
  }
  return months;
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 5);
  since.setUTCDate(1);

  const [inquiries, quotes, orders] = await Promise.all([
    supabase
      .from("inquiries")
      .select("received_at")
      .gte("received_at", since.toISOString()),
    supabase
      .from("quotes")
      .select("status, vat_rate, quote_items(quantity, unit_price)"),
    supabase.from("orders").select("status, total"),
  ]);

  if (inquiries.error) {
    throw new Error(`Failed to load inquiries: ${inquiries.error.message}`);
  }
  if (quotes.error) {
    throw new Error(`Failed to load quotes: ${quotes.error.message}`);
  }
  if (orders.error) {
    throw new Error(`Failed to load orders: ${orders.error.message}`);
  }

  const inquiryCounts = new Map<string, number>();
  for (const inquiry of inquiries.data) {
    const key = monthKey(inquiry.received_at);
    inquiryCounts.set(key, (inquiryCounts.get(key) ?? 0) + 1);
  }
  const inquiriesByMonth = lastMonths(6).map((month) => ({
    month,
    count: inquiryCounts.get(month) ?? 0,
  }));

  const quoteBuckets = new Map<string, { count: number; value: number }>();
  for (const quote of quotes.data) {
    const subtotal = quote.quote_items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const gross = subtotal * (1 + quote.vat_rate / 100);
    const bucket = quoteBuckets.get(quote.status) ?? { count: 0, value: 0 };
    bucket.count += 1;
    bucket.value += gross;
    quoteBuckets.set(quote.status, bucket);
  }
  const quotesByStatus = [...quoteBuckets.entries()]
    .map(([status, bucket]) => ({
      status: status as Enums<"quote_status">,
      ...bucket,
    }))
    .sort((a, b) => b.count - a.count);

  const orderBuckets = new Map<string, { count: number; value: number }>();
  for (const order of orders.data) {
    const bucket = orderBuckets.get(order.status) ?? { count: 0, value: 0 };
    bucket.count += 1;
    bucket.value += Number(order.total);
    orderBuckets.set(order.status, bucket);
  }
  const ordersByStatus = [...orderBuckets.entries()]
    .map(([status, bucket]) => ({
      status: status as Enums<"order_status">,
      ...bucket,
    }))
    .sort((a, b) => b.count - a.count);

  const decidedQuotes = quotes.data.filter((quote) =>
    ["accepted", "rejected", "expired"].includes(quote.status)
  );
  const acceptedQuotes = quotes.data.filter(
    (quote) => quote.status === "accepted"
  );

  return {
    inquiriesByMonth,
    quotesByStatus,
    ordersByStatus,
    totals: {
      inquiries: inquiries.data.length,
      quotes: quotes.data.length,
      orders: orders.data.length,
      ordersValue: orders.data.reduce(
        (sum, order) => sum + Number(order.total),
        0
      ),
      conversionRate:
        decidedQuotes.length > 0
          ? acceptedQuotes.length / decidedQuotes.length
          : null,
    },
  };
}
