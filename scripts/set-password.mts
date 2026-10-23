// Set (or change) the password on an existing account. Run it yourself; the
// password is typed at a hidden prompt and goes straight to Supabase. It is
// never printed, logged or written to a file.
//
// Production (fetches the project's keys with the Supabase CLI, so no secret
// needs to sit in a file):
//   npx tsx scripts/set-password.mts paul.cloutier@gmail.com --project-ref dzdgfbmwwzwfbycerimn
//
// Local (uses .env.local):
//   npx tsx --env-file=.env.local scripts/set-password.mts tester@trips.test
//
// It only changes an account that already exists; it never creates one.

import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "project-ref": { type: "string" } },
});
const email = z.email().parse(positionals[0]).toLowerCase();

function hostedKeys(ref: string) {
  const out = execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", ref, "--reveal", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  );
  const keys = z.array(z.object({ type: z.string().nullish(), api_key: z.string().nullish() })).parse(JSON.parse(out));
  const secret = keys.find((k) => k.type === "secret")?.api_key;
  if (!secret) throw new Error("No secret key found for that project");
  return { url: `https://${ref}.supabase.co`, secret };
}

const ref = values["project-ref"];
const { url, secret } = ref
  ? hostedKeys(z.string().regex(/^[a-z]{20}$/).parse(ref))
  : {
      url: z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL),
      secret: z.string().min(1).parse(process.env.SUPABASE_SECRET_KEY),
    };

// Piped input arrives in one go; hand it out a line at a time.
let piped: Promise<string[]> | null = null;
async function pipedLine() {
  piped ??= (async () => {
    let all = "";
    for await (const chunk of process.stdin) all += chunk.toString();
    return all.split(/\r?\n/);
  })();
  return (await piped).shift() ?? "";
}

// Read a line without echoing it. Falls back to a plain line when stdin is not
// a terminal (piped input, for testing).
function ask(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      pipedLine().then((line) => {
        process.stdout.write("\n");
        resolve(line);
      }, reject);
      return;
    }
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          reject(new Error("Cancelled"));
          return;
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
if (listError) throw listError;
const user = list.users.find((u) => u.email?.toLowerCase() === email);
if (!user) {
  console.error(`No account for ${email} on ${url}. This script never creates one.`);
  process.exit(1);
}

const password = await ask(`New password for ${email}: `);
const again = await ask("Type it again: ");
if (password !== again) {
  console.error("Those didn't match. Nothing changed.");
  process.exit(1);
}
if (password.length < 8 || password.length > 200) {
  console.error("Use at least 8 characters. Nothing changed.");
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
if (error) {
  console.error(`Supabase refused it: ${error.message}`);
  process.exit(1);
}
console.log(`Password set for ${email}. Sign in with it on ${ref ? "the live site" : "the local app"}.`);
