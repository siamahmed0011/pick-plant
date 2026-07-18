"use client";
import { useEffect, useState } from "react";
export function useMobile(breakpoint = 1024) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}
