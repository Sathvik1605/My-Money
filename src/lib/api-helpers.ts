import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function unauthorized() {
  return jsonError("Unauthorized", 401);
}

export function notFound(what = "Resource") {
  return jsonError(`${what} not found`, 404);
}
