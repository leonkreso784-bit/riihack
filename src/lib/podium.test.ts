import { describe, expect, it } from "vitest";
import { closeMonthConfirm, podiumReplayIsClean } from "./podium";

describe("podiumReplayIsClean (#266, 14)", () => {
  const running = { status: "running", round: 2 };

  it("dok nitko nije zatvorio tekući mjesec, podij prošlog mjeseca je čist", () => {
    expect(podiumReplayIsClean(running, [{ closedRound: 1 }, { closedRound: 1 }])).toBe(true);
  });

  it("čim jedan student zatvori srpanj, podij za lipanj bi pomiješao mjesece", () => {
    expect(podiumReplayIsClean(running, [{ closedRound: 1 }, { closedRound: 2 }])).toBe(false);
  });

  it("računalni hoteli se ne broje", () => {
    expect(podiumReplayIsClean(running, [{ closedRound: 1 }, { closedRound: 2, isBot: true }])).toBe(true);
  });

  it("nakon kraja sezone svi su zatvorili zadnji mjesec, a podij je i dalje čist", () => {
    expect(podiumReplayIsClean({ status: "finished", round: 4 }, [{ closedRound: 4 }])).toBe(true);
  });
});

describe("closeMonthConfirm (#266, 13)", () => {
  it("kaže koliko studenata još igra, uz ispravan padež", () => {
    expect(closeMonthConfirm("lipanj", "srpanj", 1, 1)).toBe("Zatvoriti lipanj i otvoriti srpanj? Još igra 1 student. Neodgovorene situacije vrijede 1 od 5.");
    expect(closeMonthConfirm("lipanj", "srpanj", 3, 1)).toContain("Još igraju 3 studenta.");
    expect(closeMonthConfirm("lipanj", "srpanj", 5, 1)).toContain("Još igra 5 studenata.");
    expect(closeMonthConfirm("lipanj", "srpanj", 12, 1)).toContain("Još igra 12 studenata.");
    expect(closeMonthConfirm("lipanj", "srpanj", 22, 1)).toContain("Još igraju 22 studenta.");
  });

  it("kad su svi gotovi, bez prijetnje ocjenom", () => {
    expect(closeMonthConfirm("kolovoz", "rujan", 0, 1)).toBe("Zatvoriti kolovoz i otvoriti rujan? Svi su studenti gotovi.");
  });
});
