"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { login } from "@/app/hobby/actions";
import { DEFAULT_HOBBY } from "@/data/hobby/hobbies";

const field =
  "border-input bg-field h-[46px] rounded-[14px] border px-3.5 text-[15px] outline-none transition focus:border-[var(--hb)]";

const LoginForm = ({ next }: { next: string }) => {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main data-hobby={DEFAULT_HOBBY} className="hb-dots relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div
        aria-hidden="true"
        className="absolute top-[54%] left-1/2 size-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--hb)_0%,transparent_62%)] opacity-[0.18]"
      />
      <form action={action} className="hb-glass relative flex w-full max-w-[380px] flex-col gap-3.5 rounded-[32px] px-[30px] pt-[34px] pb-[26px]">
        <div className="flex flex-col items-center gap-2.5 pb-1.5">
          <Image src="/images/logos/LogoSimpleTrans.png" alt="Tom Liu" width={52} height={52} className="dark:hidden" />
          <Image src="/images/logos/LogoSimpleDarkTrans.png" alt="Tom Liu" width={52} height={52} className="hidden dark:block" />
          <span className="text-muted-foreground text-sm font-medium tracking-wide">Admin</span>
          <span className="font-hand text-hb-ink -rotate-2 text-2xl">only Tom past this point</span>
        </div>
        <input type="hidden" name="next" value={next} />
        <label htmlFor="hb-pass" className="text-muted-foreground text-[13px]">
          Password
        </label>
        <input
          id="hb-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className={`${field} -mt-2`}
        />
        {state?.error && (
          <p role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="bg-hb-btn text-hb-on mt-2 h-12 cursor-pointer rounded-full text-[15px] font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/45%)] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <Link href={`/hobby/${DEFAULT_HOBBY}`} className="text-muted-foreground hover:text-foreground flex min-h-11 items-center self-center text-[13px]">
          Back to hobbies
        </Link>
      </form>
    </main>
  );
};

export default LoginForm;
