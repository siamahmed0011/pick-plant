import { auth } from "@/auth";
import { USER_ROLES } from "@/lib/auth/roles";

export const proxy = auth((request) => {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  if (request.auth) {
    if (isAdminRoute && request.auth.user?.role !== USER_ROLES.ADMIN) {
      return Response.redirect(new URL("/", request.nextUrl));
    }
    return;
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return Response.redirect(loginUrl);
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
