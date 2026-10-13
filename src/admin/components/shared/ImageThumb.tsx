"use client";

import clsx from "clsx";
import { Briefcase, Glasses, Footprints, Package } from "lucide-react";
import { useState } from "react";

const TINTS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6", "#ec4899"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const iconFor = (category: string) =>
  /shoe/i.test(category) ? Footprints : /glass/i.test(category) ? Glasses : /bag/i.test(category) ? Briefcase : Package;

/** Shows an image if provided/loadable, otherwise a deterministic tinted placeholder. */
export function ImageThumb({ src, name, category = "", className }: { src?: string; name: string; category?: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  const tint = TINTS[hash(name) % TINTS.length];
  const Icon = iconFor(category || name);
  if (src && failed !== src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} loading="lazy" onError={() => setFailed(src)} className={clsx("h-10 w-10 shrink-0 rounded-lg object-cover", className)} />;
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", className)}
      style={{ background: `linear-gradient(135deg, ${tint}22, ${tint}55)`, color: tint }}
    >
      <Icon className="h-1/2 w-1/2" />
    </div>
  );
}
