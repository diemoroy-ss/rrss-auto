"use client";
import { useEffect } from "react";
import { auth } from "../lib/firebase";

interface Props {
  page: string;
  event?: string;
}

export default function PageTracker({ page, event = "page_view" }: Props) {
  useEffect(() => {
    const userId = auth.currentUser?.uid || null;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, page, userId }),
    }).catch(() => {}); // silent failure
  }, [event, page]);

  return null;
}
