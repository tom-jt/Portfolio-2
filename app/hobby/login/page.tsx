import type { Metadata } from "next";
import LoginForm from "@/components/hobby/LoginForm";
import { devOpen } from "@/lib/hobby/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/** Admin sign-in. Not linked from anywhere on the site: go here directly. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next ?? ""} open={devOpen()} />;
}
