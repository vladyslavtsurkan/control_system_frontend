import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL } from "@/config/constants";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(
    `${BACKEND_API_URL}/api/v1/auth/forgot-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = await backendRes
    .json()
    .catch(() => ({ detail: "Failed to send reset code" }));
  return NextResponse.json(data, { status: backendRes.status });
}
