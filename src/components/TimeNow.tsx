"use client";

import { useEffect, useMemo, useState } from "react";

function formatDateTime(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

export function TimeNow() {
  const initial = useMemo(() => new Date(), []);
  const [now, setNow] = useState<Date>(initial);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="text-sm text-zinc-600 dark:text-zinc-400">
      当前时间：<span className="font-mono text-foreground">{formatDateTime(now)}</span>
    </div>
  );
}
