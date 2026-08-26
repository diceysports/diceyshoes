"use client";

import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  // Date.parse on an ISO string with an explicit offset (or Z) is
  // timezone-safe — the diff below is always against the viewer's own
  // local "now", not a server-assumed timezone.
  const diff = new Date(targetIso).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    expired: diff <= 0,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function ReleaseCountdown({ releaseDate }: { releaseDate: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(releaseDate));

  useEffect(() => {
    if (remaining.expired) return;
    const id = setInterval(() => setRemaining(getRemaining(releaseDate)), 1000);
    return () => clearInterval(id);
  }, [releaseDate, remaining.expired]);

  if (remaining.expired) {
    return <span className="text-sm font-semibold text-fog">Released</span>;
  }

  const Unit = ({ value, label }: { value: number; label: string }) => (
    <div className="text-center">
      <div className="font-display text-2xl leading-none">{String(value).padStart(2, "0")}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-fog">{label}</div>
    </div>
  );

  return (
    <div className="flex gap-5">
      <Unit value={remaining.days} label="Days" />
      <Unit value={remaining.hours} label="Hrs" />
      <Unit value={remaining.minutes} label="Min" />
      <Unit value={remaining.seconds} label="Sec" />
    </div>
  );
}
