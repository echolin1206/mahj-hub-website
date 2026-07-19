// Vercel serverless entry — all /api/* requests land here and are dispatched
// to the Hono app (see server/routes.ts).
import { handle } from "hono/vercel";
import { app } from "../server/routes";

export const config = { runtime: "nodejs" };

export default handle(app);
