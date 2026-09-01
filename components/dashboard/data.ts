"use client";

export const merchantId = process.env.NEXT_PUBLIC_DEMO_MERCHANT_ID || "merchant_demo";
export async function dashboardFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { "x-merchant-id": merchantId }, cache: "no-store" });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const body = await response.json() as { data: T };
  return body.data;
}
