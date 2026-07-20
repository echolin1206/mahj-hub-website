import { handle } from "hono/vercel";
import { app } from "../server/routes";

export const config = { runtime: "nodejs" };

export default handle(app);
