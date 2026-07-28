"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type NavigationDirection = "forward" | "back";

/**
 * Detect browser back vs forward/link navigation for route motion direction.
 * Back → exit right, enter from left. Forward → exit left, enter from right.
 */
export function useNavigationDirection(): NavigationDirection {
  const pathname = usePathname() || "/";
  const [direction, setDirection] = useState<NavigationDirection>("forward");
  const stackRef = useRef<string[]>([pathname]);
  const fromPopRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromPopRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const stack = stackRef.current;
    const top = stack[stack.length - 1];
    if (pathname === top) return;

    const existingIdx = stack.indexOf(pathname);

    if (fromPopRef.current) {
      fromPopRef.current = false;
      if (existingIdx >= 0 && existingIdx < stack.length - 1) {
        setDirection("back");
        stackRef.current = stack.slice(0, existingIdx + 1);
      } else if (existingIdx >= 0) {
        setDirection("forward");
        stackRef.current = stack.slice(0, existingIdx + 1);
      } else {
        setDirection("forward");
        stackRef.current = [...stack, pathname];
      }
      return;
    }

    setDirection("forward");
    if (existingIdx === -1) {
      stackRef.current = [...stack, pathname];
    } else {
      stackRef.current = stack.slice(0, existingIdx + 1);
    }
  }, [pathname]);

  return direction;
}
