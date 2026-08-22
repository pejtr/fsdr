import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});


describe("auth.me public access", () => {
  it("returns null instead of requiring login for anonymous visitors", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.me()).resolves.toBeNull();
  });
});

// Public-route regression guard: anonymous auth is handled at the component
// boundary, never by a global query-cache redirect in client/src/main.tsx.
describe("anonymous public-route regression", () => {
  it("does not globally redirect every unauthorized tRPC query", () => {
    const mainSource = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    expect(mainSource).not.toContain("redirectToLoginIfUnauthorized");
    expect(mainSource).not.toContain("window.location.href = getLoginUrl()");
  });
});

// The sitewide upsell widget is mounted on public pages, so its protected
// query must stay disabled until the auth state is known to be authenticated.
describe("public revenue widgets", () => {
  it("guards the protected upsell query", () => {
    const componentSource = readFileSync(
      resolve(process.cwd(), "client/src/components/RevenueComponents.tsx"),
      "utf8",
    );
    expect(componentSource).toContain("enabled: isAuthenticated");
  });
});
