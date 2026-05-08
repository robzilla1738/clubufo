import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export function proxy(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("ADMIN_PASSWORD env var is not set", {
      status: 503,
    });
  }

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return unauthorized();
  }
  const [, pass = ""] = decoded.split(":");
  if (pass !== password) return unauthorized();

  return NextResponse.next();
}

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ClubUFO admin", charset="UTF-8"',
    },
  });
}
