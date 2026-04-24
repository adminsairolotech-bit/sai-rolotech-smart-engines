import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
declare let pool: pg.Pool | null;
declare const db: ReturnType<typeof drizzle<typeof schema>>;
export { pool, db };
export * from "./schema/index.js";
//# sourceMappingURL=index.d.ts.map