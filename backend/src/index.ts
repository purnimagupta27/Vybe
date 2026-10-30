import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import 'dotenv/config';
import * as authSchema from "./db/auth-schema.js"
import * as connectionRequestSchema from "./db/connectionRequest-schema.js"


const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema: { ...authSchema, ...connectionRequestSchema } });

export default db