import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { withBase } from "@/lib/format";

export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL(withBase("/login"), req.url), 303);
}
