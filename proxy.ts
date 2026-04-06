import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Frontend auth is hydrated client-side from the access token in sessionStorage
  // and the backend refresh cookie, so edge redirects based on Vercel-domain cookies
  // will incorrectly log users out in production.
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
