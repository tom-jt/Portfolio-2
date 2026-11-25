"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { HobbyId } from "@/data/hobby/hobbies";

/**
 * A faint lock in the bottom-right corner, the way into admin sign-in. A
 * single click does nothing; two quick clicks (or taps) open the sign-in,
 * so a visitor who brushes it is never sent anywhere.
 */
const AdminDoor = ({ hobby }: { hobby: HobbyId }) => {
  const router = useRouter();
  const last = useRef(0);

  return (
    <button
      type="button"
      aria-label="Admin sign-in (double-click)"
      title="Admin"
      onClick={() => {
        const now = Date.now();
        if (now - last.current < 400) router.push(`/hobby/login?next=/hobby/${hobby}`);
        last.current = now;
      }}
      className="text-faint fixed right-4 bottom-4 z-[90] grid size-9 cursor-pointer touch-manipulation place-items-center rounded-full opacity-40 transition-opacity hover:opacity-90 focus-visible:opacity-90"
    >
      <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
};

export default AdminDoor;
