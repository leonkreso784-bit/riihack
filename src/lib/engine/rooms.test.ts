import { describe, expect, it } from "vitest";
import { compareRooms, pickRoom } from "./rooms";

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

describe("compareRooms (#266, 12)", () => {
  const room = (floor: number, number: string) => ({ floor, number });

  it("sobe istog kata idu brojčano, ne tekstualno: 6, 7, 8, 9, 10", () => {
    const shuffled = [room(2, "10"), room(2, "7"), room(2, "9"), room(2, "6"), room(2, "8")];
    expect(shuffled.sort(compareRooms).map((r) => r.number)).toEqual(["6", "7", "8", "9", "10"]);
  });

  it("prvo kat, pa broj", () => {
    const rooms = [room(3, "11"), room(1, "5"), room(2, "10"), room(1, "1"), room(3, "12"), room(2, "6")];
    expect(rooms.sort(compareRooms).map((r) => r.number)).toEqual(["1", "5", "6", "10", "11", "12"]);
  });

  it("troznamenkasti brojevi kao prije", () => {
    const rooms = [room(2, "205"), room(1, "105"), room(2, "201"), room(1, "101")];
    expect(rooms.sort(compareRooms).map((r) => r.number)).toEqual(["101", "105", "201", "205"]);
  });
});
