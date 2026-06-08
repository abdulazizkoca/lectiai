"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentLivePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/join"); }, [router]);
  return null;
}
