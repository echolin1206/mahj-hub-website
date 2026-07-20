import { handle } from "hono/vercel";
import { app } from "../../server/routes.js";

export const config = { runtime: "nodejs" };

export default handle(app);
