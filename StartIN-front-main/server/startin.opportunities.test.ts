import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("opportunities.list", () => {
  it("returns a typed empty collection ready for database data", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.opportunities.list();

    expect(result).toEqual({ items: [], nextCursor: null });
    expect(Array.isArray(result.items)).toBe(true);
  });
});
