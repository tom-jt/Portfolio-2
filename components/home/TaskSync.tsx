"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Copy } from "lucide-react";
import { renderSVG } from "uqr";
import {
  formatCode,
  isValidCode,
  joinSync,
  normaliseCode,
  startSync,
  stopSync,
  syncLink,
  useSync,
  useSyncStatus,
  type SyncStatus,
} from "@/lib/home/sync";
import { cn } from "@/lib/utils";
import { Eyebrow, IconButton, PrimaryButton, textButton } from "./ui";

const STATUS: Record<SyncStatus, string> = {
  off: "starting…",
  connecting: "connecting…",
  synced: "up to date",
  offline: "can't reach the relays, will try again",
};

const LINK = cn(textButton, "text-muted-foreground text-xs");

/** Pairing and status for task sync, shown in place of the list. */
const TaskSync = ({ onBack }: { onBack: () => void }) => {
  const { code } = useSync();
  const { state } = useSyncStatus();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const typed = normaliseCode(draft);

  const link = code ? syncLink(code) : "";
  const qr = useMemo(
    () =>
      link
        ? renderSVG(link, {
            border: 2,
            ecc: "M",
            whiteColor: "#fff",
            blackColor: "#14141a",
          })
        : "",
    [link],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-0.5 text-sm">
      {code ? (
        <>
          <p className="text-muted-foreground">
            scan this code with the camera, or copy the code below and enter it
            on the other device.
          </p>
          <div
            role="img"
            aria-label="sync link as a QR code"
            className="mx-auto size-40 overflow-hidden rounded-xl bg-white [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <div className="flex items-center gap-2">
            <code className="border-glass-edge flex-1 rounded-full border bg-black/20 px-4 py-2 text-center font-mono text-[0.8rem] tracking-wide">
              {formatCode(code)}
            </code>
            <IconButton
              label={copied ? "link copied" : "copy link"}
              onClick={() => {
                navigator.clipboard?.writeText(link).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              <Copy className={cn("size-4", copied && "text-glow")} />
            </IconButton>
          </div>
          <p className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                state === "synced"
                  ? "bg-glow"
                  : state === "offline"
                    ? "bg-destructive"
                    : "bg-white/30 animate-pulse",
              )}
            />
            <span aria-live="polite">{STATUS[state]}</span>
          </p>
          <p className="text-muted-foreground text-xs">
            note: your tasks and garden level sync encrypted using the above
            code. anyone with this code can see your tasks.
          </p>
          <div className="mt-auto flex items-center justify-between gap-3">
            <button type="button" onClick={stopSync} className={LINK}>
              stop syncing on this device
            </button>
            <button type="button" onClick={onBack} className={LINK}>
              back to tasks
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            sync this list and your garden level with any device. one-time set
            up per device. no accounts needed.
          </p>
          <PrimaryButton onClick={startSync} className="self-start">
            link a device
          </PrimaryButton>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isValidCode(typed)) joinSync(typed);
            }}
            className="flex flex-col gap-2"
          >
            <Eyebrow>or enter a code from another device</Eyebrow>
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
                aria-label="sync code"
                autoComplete="off"
                spellCheck={false}
                className="border-glass-edge placeholder:text-muted-foreground/50 focus:border-glow/70 focus:ring-glow/20 h-10 min-w-0 flex-1 rounded-full border bg-black/20 px-4 font-mono text-[0.8rem] transition outline-none focus:ring-4"
              />
              <IconButton
                type="submit"
                label="join"
                disabled={!isValidCode(typed)}
              >
                <ArrowRight className="size-4" />
              </IconButton>
            </div>
          </form>
          <button
            type="button"
            onClick={onBack}
            className={cn(LINK, "mt-auto self-end")}
          >
            back to tasks
          </button>
        </>
      )}
    </div>
  );
};

export default TaskSync;
