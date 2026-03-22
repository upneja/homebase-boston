import { readFileSync } from "fs";
import { join } from "path";
import { getDb } from "./db";

export async function initDb(): Promise<void> {
  const db = getDb();
  const schemaPath = join(__dirname, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");

  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(statement);
  }

  console.log(`Database initialized: ${statements.length} statements executed`);
}
