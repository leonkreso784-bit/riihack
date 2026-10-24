import { describe, expect, it } from "vitest";
import { pickRoom } from "./rooms";

const rooms = [
  { number: "201", type: "double" as const },
  { number: "102", type: "double" as const },
  { number: "101", type: "single" as const },
];

describe("pickRoom", () => {
  it("bira prvu sobu te vrste po broju", () => {
    expect(pickRoom(rooms, "double")).toBe("102");
  });
  it("bez te vrste bira prvu po broju", () => {
    expect(pickRoom(rooms, "suite")).toBe("101");
  });
  it("prazan popis daje null", () => {
    expect(pickRoom([], "double")).toBeNull();
  });
});
