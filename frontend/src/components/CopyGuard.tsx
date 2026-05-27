import { useEffect, type ReactNode } from "react";

function isEditableElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if ((target as HTMLElement).isContentEditable) return true;
  return false;
}

export function CopyGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (isEditableElement(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("copy", handler);
    return () => document.removeEventListener("copy", handler);
  }, []);

  return children;
}

