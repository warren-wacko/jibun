import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { PrismaClient } from "../src/generated/prisma/client";

/** npm run admin:create: creates the admin account, or resets its password. The password is never echoed or stored in plain text. */
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL (or DIRECT_URL) in .env first");

function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const out = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output: out, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
    muted = hidden; // the prompt text is already written; hide only what is typed
  });
}

async function main() {
  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That is not an email address");
  const password = await ask("Password (min 12 characters): ", true);
  if (password.length < 12) throw new Error("Use at least 12 characters");
  if (password !== (await ask("Repeat password: ", true))) throw new Error("The passwords do not match");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString as string }) });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN" },
  });
  console.log(`Admin ready: ${user.email}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
