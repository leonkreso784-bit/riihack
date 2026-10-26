// Zajednički omotač za route handlere: JSON odgovor, HttpError -> { error } sa statusom.
import type { ApiError } from "./types";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// ctx.params je Promise u Next.js 16; handler ga awaita (npr. `const { id } = await ctx.params`).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = any;

export function route<T>(
  fn: (req: Request, ctx: Ctx) => Promise<T>,
): (req: Request, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const data = await fn(req, ctx);
      return data instanceof Response ? data : Response.json(data); // datoteke (CSV) vraćaju gotov Response
    } catch (err) {
      if (err instanceof HttpError) {
        const body: ApiError = { error: err.message };
        return Response.json(body, { status: err.status });
      }
      console.error(err);
      const body: ApiError = { error: "Nešto je pošlo po zlu. Pokušaj ponovno." };
      return Response.json(body, { status: 500 });
    }
  };
}
