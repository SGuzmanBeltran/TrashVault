import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

import { drizzle } from 'drizzle-orm/node-postgres';

export const schema = { ...appSchema, ...authSchema };
export const db = drizzle(process.env.DATABASE_URL!, { schema });
