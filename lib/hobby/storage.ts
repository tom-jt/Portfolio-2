/**
 * Where each hobby's JSON lives. Server only.
 *
 * In production, a private GitHub repo: one file per hobby, and every save is
 * a commit, so git history is the audit log and `git revert` is the rollback.
 * Set HOBBY_GITHUB_TOKEN (fine-grained, that repo only, Contents: read and
 * write) and HOBBY_GITHUB_REPO ("owner/name"); HOBBY_GITHUB_BRANCH defaults
 * to the repo's default branch. Protect that branch against force pushes and deletion so the
 * history stays append-only.
 *
 * Without them, local dev keeps the files in .hobby-data/ (gitignored), with a
 * plain history log beside them. On Vercel without them the site reads empty
 * tabs and refuses saves, since its filesystem is read-only.
 */

import { createHash } from "node:crypto";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HobbyId } from "@/data/hobby/hobbies";
import { emptyDoc, type HobbyDoc } from "./model";

export interface Stored {
  doc: HobbyDoc;
  /** Version of the file the doc was read from; null when none exists yet. */
  sha: string | null;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly kind: "conflict" | "unconfigured" | "failed",
  ) {
    super(message);
  }
}

const token = process.env.HOBBY_GITHUB_TOKEN?.trim();
/** "owner/name". A pasted repo URL works too: https://github.com/owner/name(.git). */
const repo = process.env.HOBBY_GITHUB_REPO?.trim()
  .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
  .replace(/\.git$/i, "")
  .replace(/\/+$/, "");
/** Unset means the repo's default branch, whatever it is called. */
const branch = process.env.HOBBY_GITHUB_BRANCH?.trim() || undefined;

type Mode = "github" | "local" | "none";
const mode: Mode = token && repo ? "github" : process.env.VERCEL ? "none" : "local";

export const storageMode = mode;

const LOCAL_DIR = path.join(process.cwd(), ".hobby-data");

/** Fill in anything an older file lacks, so a schema addition never breaks a read. */
function normalise(hobby: HobbyId, raw: unknown): HobbyDoc {
  const base = emptyDoc(hobby);
  if (!raw || typeof raw !== "object") return base;
  const d = raw as Partial<HobbyDoc>;
  return {
    version: 1,
    hobby,
    fields: Array.isArray(d.fields) ? d.fields : base.fields,
    tags: Array.isArray(d.tags) ? d.tags : [],
    show: d.show ? { ...base.show, ...d.show, fields: { ...d.show.fields } } : base.show,
    cards: Array.isArray(d.cards)
      ? d.cards.map((c) => ({ ...c, values: c.values ?? {}, tagIds: c.tagIds ?? [] }))
      : [],
  };
}

// ---------------------------------------------------------------------------
// GitHub
// ---------------------------------------------------------------------------

const api = (file: string) =>
  `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(file)}`;

const ghHeaders = () => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "hobby-site",
});

async function ghRead(hobby: HobbyId): Promise<Stored> {
  const res = await fetch(`${api(`${hobby}.json`)}${branch ? `?ref=${encodeURIComponent(branch)}` : ""}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });
  if (res.status === 404) return { doc: emptyDoc(hobby), sha: null };
  if (!res.ok) throw new StorageError(await ghProblem("read", res), "failed");
  const body = (await res.json()) as { content: string; sha: string };
  const text = Buffer.from(body.content, "base64").toString("utf8");
  return { doc: normalise(hobby, JSON.parse(text)), sha: body.sha };
}

async function ghWrite(hobby: HobbyId, doc: HobbyDoc, sha: string | null, message: string) {
  const res = await fetch(api(`${hobby}.json`), {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      ...(branch ? { branch } : {}),
      content: Buffer.from(JSON.stringify(doc, null, 2) + "\n").toString("base64"),
      ...(sha ? { sha } : {}),
    }),
    cache: "no-store",
  });
  // GitHub answers a stale sha with 409, or 422 when the file appeared meanwhile.
  if (res.status === 409 || (res.status === 422 && !sha)) {
    throw new StorageError("Someone saved this tab meanwhile. Reload and try again.", "conflict");
  }
  if (!res.ok) throw new StorageError(await ghProblem("save", res), "failed");
}

/** GitHub's own reason, plus the likely fix, for the toast and the logs. */
async function ghProblem(what: string, res: Response) {
  const reason = await res
    .json()
    .then((b: { message?: string }) => b.message)
    .catch(() => undefined);
  const hint =
    res.status === 404
      ? ` Check HOBBY_GITHUB_REPO is "owner/name" (now "${repo}") and the token has access to that repo.`
      : res.status === 401 || res.status === 403
        ? " Check the token hasn't expired and has Contents: read and write."
        : "";
  const text = `GitHub ${what} failed (${res.status}${reason ? `: ${reason}` : ""}).${hint}`;
  console.error(`[hobby] ${text}`);
  return text;
}

// ---------------------------------------------------------------------------
// Local files, for development
// ---------------------------------------------------------------------------

const fileSha = (text: string) => createHash("sha1").update(text).digest("hex");

async function localRead(hobby: HobbyId): Promise<Stored> {
  try {
    const text = await readFile(path.join(LOCAL_DIR, `${hobby}.json`), "utf8");
    return { doc: normalise(hobby, JSON.parse(text)), sha: fileSha(text) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return { doc: emptyDoc(hobby), sha: null };
    throw e;
  }
}

async function localWrite(hobby: HobbyId, doc: HobbyDoc, sha: string | null, message: string) {
  const current = await localRead(hobby);
  if (current.sha !== sha) {
    throw new StorageError("Someone saved this tab meanwhile. Reload and try again.", "conflict");
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, `${hobby}.json`), JSON.stringify(doc, null, 2) + "\n");
  const entry = `--- ${new Date().toISOString()}\n${message}\n\n`;
  await appendFile(path.join(LOCAL_DIR, "history.log"), entry);
}

// ---------------------------------------------------------------------------

/** The file as it stands now, never cached: every save starts from this. */
export async function readStored(hobby: HobbyId): Promise<Stored> {
  if (mode === "github") return ghRead(hobby);
  if (mode === "local") return localRead(hobby);
  return { doc: emptyDoc(hobby), sha: null };
}

/** Saves the doc if the file is still at `sha`. `message` becomes the commit. */
export async function writeStored(hobby: HobbyId, doc: HobbyDoc, sha: string | null, message: string) {
  if (mode === "github") return ghWrite(hobby, doc, sha, message);
  if (mode === "local") return localWrite(hobby, doc, sha, message);
  throw new StorageError(
    "Saving isn't set up yet: add HOBBY_GITHUB_TOKEN and HOBBY_GITHUB_REPO to the Vercel env.",
    "unconfigured",
  );
}
