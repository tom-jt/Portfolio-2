import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HobbyApp from "@/components/hobby/HobbyApp";
import { HOBBIES, hobbyById } from "@/data/hobby/hobbies";
import { getHobbyDoc } from "@/lib/hobby/data";

type Props = { params: Promise<{ hobby: string }> };

// One static page per hobby, refreshed whenever the admin saves (see
// updateTag in actions.ts), and hourly as a fallback.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return HOBBIES.map((h) => ({ hobby: h.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hobby = hobbyById((await params).hobby);
  if (!hobby) return {};
  return {
    title: hobby.name,
    description: hobby.blurb,
    alternates: { canonical: `/hobby/${hobby.id}` },
  };
}

export default async function HobbyPage({ params }: Props) {
  const hobby = hobbyById((await params).hobby);
  if (!hobby) notFound();
  const doc = await getHobbyDoc(hobby.id);
  return <HobbyApp key={hobby.id} hobby={hobby.id} initialDoc={doc} />;
}
