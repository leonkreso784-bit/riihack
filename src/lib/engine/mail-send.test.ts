import { describe, expect, it } from "vitest";
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX } from "@/lib/rules";
import type { MailMessage } from "@/lib/types";
import {
  MAIL_PER_GAME,
  MAIL_PER_MINUTE,
  MAIL_PER_RECIPIENT,
  checkMailLimit,
  checkSendMail,
  mergeSentMail,
  recipientRefusal,
  replySubject,
} from "./mail-send";

const ok = { toCompanyId: "ivan", subject: "Prijedlog suradnje", body: "Šaljemo vam goste kad smo puni." };

describe("checkSendMail", () => {
  it("ispravna poruka prolazi, naslov i tekst su obrezani", () => {
    const check = checkSendMail({ ...ok, subject: "  Pozdrav  ", body: "\n Tekst \n" }, "ana");
    expect(check).toEqual({ ok: true, data: { toCompanyId: "ivan", subject: "Pozdrav", body: "Tekst" } });
  });

  it("nepoznata polja se odbacuju, pošiljatelja ne može zadati tijelo zahtjeva", () => {
    const check = checkSendMail({ ...ok, fromCompanyId: "netko-drugi", worldId: "x" }, "ana");
    expect(check.ok && Object.keys(check.data).sort()).toEqual(["body", "subject", "toCompanyId"]);
  });

  it("granice duljine: točno najviše prolazi, jedan znak više ne", () => {
    expect(checkSendMail({ ...ok, subject: "x".repeat(MAIL_SUBJECT_MAX), body: "y".repeat(MAIL_BODY_MAX) }, "ana").ok).toBe(true);
    const longSubject = checkSendMail({ ...ok, subject: "x".repeat(MAIL_SUBJECT_MAX + 1) }, "ana");
    expect(!longSubject.ok && longSubject.fields.subject).toBe(`Naslov mora imati od 1 do ${MAIL_SUBJECT_MAX} znakova`);
    const longBody = checkSendMail({ ...ok, body: "y".repeat(MAIL_BODY_MAX + 1) }, "ana");
    expect(!longBody.ok && longBody.fields.body).toBe(`Tekst mora imati od 1 do ${MAIL_BODY_MAX} znakova`);
  });

  it("razmaci se ne broje: prazan ili samo razmaci → greška polja", () => {
    for (const subject of ["", "   ", "\n\t"]) {
      const check = checkSendMail({ ...ok, subject }, "ana");
      expect(!check.ok && check.fields.subject).toMatch(/Naslov/);
    }
    const check = checkSendMail({ ...ok, body: "   " }, "ana");
    expect(!check.ok && check.fields.body).toMatch(/Tekst/);
    // 1000 znakova okruženo razmacima je i dalje 1000 znakova teksta
    expect(checkSendMail({ ...ok, body: ` ${"y".repeat(MAIL_BODY_MAX)} ` }, "ana").ok).toBe(true);
  });

  it("primatelj: obavezan, tekst, ne vlastiti hotel", () => {
    for (const toCompanyId of ["", undefined, null, 5, {}]) {
      const check = checkSendMail({ ...ok, toCompanyId }, "ana");
      expect(!check.ok && check.fields.toCompanyId).toBe("Odaberi hotel kojem pišeš");
    }
    const self = checkSendMail({ ...ok, toCompanyId: "ana" }, "ana");
    expect(!self.ok && self.fields.toCompanyId).toBe("Ne možeš pisati sam sebi");
  });

  it("krivi tipovi naslova i teksta daju istu hrvatsku poruku kao prazno polje", () => {
    const check = checkSendMail({ toCompanyId: "ivan", subject: 3, body: ["a"] }, "ana");
    expect(!check.ok && check.fields.subject).toMatch(/Naslov/);
    expect(!check.ok && check.fields.body).toMatch(/Tekst/);
    const missing = checkSendMail({ toCompanyId: "ivan" }, "ana");
    expect(!missing.ok && Object.keys(missing.fields).sort()).toEqual(["body", "subject"]);
  });

  it("error je prva greška redom primatelj, naslov, tekst; fields ima prvu grešku svakog polja", () => {
    const check = checkSendMail({ toCompanyId: "ana", subject: "", body: "" }, "ana");
    expect(check.ok).toBe(false);
    if (check.ok) return;
    expect(check.error).toBe("Ne možeš pisati sam sebi");
    expect(Object.keys(check.fields).sort()).toEqual(["body", "subject", "toCompanyId"]);
    // naslov je prazan, a tekst predug: prva je greška naslova
    const two = checkSendMail({ ...ok, subject: " ", body: "y".repeat(MAIL_BODY_MAX + 1) }, "ana");
    expect(!two.ok && two.error).toMatch(/Naslov/);
  });

  it("tijelo koje nije objekt → opća greška bez polja, nikad izuzetak", () => {
    for (const input of [null, undefined, "tekst", 7, []]) {
      const check = checkSendMail(input, "ana");
      expect(check).toEqual({ ok: false, error: "Neispravna poruka", fields: {} });
    }
  });
});

describe("checkMailLimit", () => {
  const none = { total: 0, recent: 0, toRecipient: 0 };

  it("ispod svih granica nema greške", () => {
    expect(checkMailLimit(none)).toBeNull();
    expect(checkMailLimit({ total: MAIL_PER_GAME - 1, recent: MAIL_PER_MINUTE - 1, toRecipient: MAIL_PER_RECIPIENT - 1 })).toBeNull();
  });

  it("granica po minuti: peta poruka prolazi, šesta ne", () => {
    expect(checkMailLimit({ ...none, recent: MAIL_PER_MINUTE - 1 })).toBeNull();
    expect(checkMailLimit({ ...none, recent: MAIL_PER_MINUTE })).toMatch(/zadnjoj minuti/);
  });

  it("granica po primatelju", () => {
    expect(checkMailLimit({ ...none, toRecipient: MAIL_PER_RECIPIENT - 1 })).toBeNull();
    expect(checkMailLimit({ ...none, toRecipient: MAIL_PER_RECIPIENT })).toMatch(/Ovom si hotelu/);
  });

  it("granica po igri", () => {
    expect(checkMailLimit({ ...none, total: MAIL_PER_GAME - 1 })).toBeNull();
    expect(checkMailLimit({ ...none, total: MAIL_PER_GAME })).toMatch(/u ovoj igri/);
  });

  it("prednost: igra, pa primatelj, pa minuta", () => {
    const all = { total: MAIL_PER_GAME, recent: MAIL_PER_MINUTE, toRecipient: MAIL_PER_RECIPIENT };
    expect(checkMailLimit(all)).toBe(checkMailLimit({ ...none, total: MAIL_PER_GAME }));
    expect(checkMailLimit({ ...all, total: 0 })).toBe(checkMailLimit({ ...none, toRecipient: MAIL_PER_RECIPIENT }));
  });

  it("granice rastu od minute preko primatelja do igre", () => {
    expect(MAIL_PER_MINUTE).toBeLessThan(MAIL_PER_RECIPIENT);
    expect(MAIL_PER_RECIPIENT).toBeLessThan(MAIL_PER_GAME);
  });
});

describe("recipientRefusal", () => {
  it("hotel koji postoji i vodi ga student može primiti poruku", () => {
    expect(recipientRefusal({ isBot: false })).toBeNull();
  });

  it("nepoznat hotel → 404", () => {
    expect(recipientRefusal(undefined)).toEqual({ status: 404, error: "Hotel nije pronađen" });
  });

  it("bot → 400, nitko ne čita njegovu poštu", () => {
    expect(recipientRefusal({ isBot: true })).toEqual({ status: 400, error: "Hotel vodi računalo i ne čita poruke" });
  });
});

describe("replySubject", () => {
  it("dodaje Re: jednom", () => {
    expect(replySubject("Suradnja")).toBe("Re: Suradnja");
    expect(replySubject("Re: Suradnja")).toBe("Re: Suradnja");
  });

  it("skraćuje na najviše znakova naslova, a rezultat prolazi provjeru poruke", () => {
    const long = replySubject("x".repeat(200));
    expect(long).toHaveLength(MAIL_SUBJECT_MAX);
    expect(long.endsWith("…")).toBe(true);
    expect(checkSendMail({ ...ok, subject: long }, "ana").ok).toBe(true);
  });
});

describe("mergeSentMail", () => {
  const msg = (id: string): MailMessage => ({ id, kind: "hotel", threadId: `t-${id}`, fromName: "A", toName: "B", subject: "S", body: "T", at: "2026-10-26T10:00:00.000Z", read: true, mine: true });

  it("poslana poruka koje još nema u odgovoru dolazi iza pohranjenih", () => {
    expect(mergeSentMail([msg("a"), msg("b")], [msg("c")]).map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("kad je anketa vrati, ne udvostručuje se (pohranjena ima prednost)", () => {
    const stored = { ...msg("c"), read: false };
    const merged = mergeSentMail([stored], [msg("c")]);
    expect(merged).toEqual([stored]);
  });

  it("prazne liste", () => {
    expect(mergeSentMail([], [])).toEqual([]);
    expect(mergeSentMail([msg("a")], [])).toEqual([msg("a")]);
  });
});
