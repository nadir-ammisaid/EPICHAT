import { describe, expect, it } from "vitest";
import {
  buildPaginationArgs,
  paginateResult,
} from "../src/shared/utils/pagination.js";

describe("pagination utils", () => {
  it("builds pagination args without cursor", () => {
    expect(buildPaginationArgs(20)).toEqual({
      take: 20,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  });

  it("builds pagination args with cursor", () => {
    expect(buildPaginationArgs(20, "msg-42")).toEqual({
      take: 20,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: { id: "msg-42" },
      skip: 1,
    });
  });

  it("paginates rows and returns next cursor", () => {
    const rows = [
      { id: "m3", body: "new" },
      { id: "m2", body: "mid" },
      { id: "m1", body: "old" },
    ];

    const result = paginateResult(rows);

    expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
    expect(result.nextCursor).toBe("m1");
  });

  it("returns null cursor for empty rows", () => {
    const result = paginateResult([] as Array<{ id: string }>);

    expect(result.messages).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});
