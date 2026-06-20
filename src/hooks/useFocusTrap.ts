import { useEffect, useRef } from "react";

/**
 * Modal/drawer'lar için erişilebilir odak tuzağı (focus trap).
 * - Açılışta panel içindeki ilk odaklanabilir öğeye odaklanır.
 * - Tab/Shift+Tab döngüsünü panel içinde tutar.
 * - ESC ile onEscape çağrılır.
 * - Kapanışta odak, açılıştan önceki öğeye geri verilir.
 *
 * Kullanım: panel elemanına `ref={ref}` ve `tabIndex={-1}` verin.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onEscape?: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    // Açılışta ilk odaklanabilir öğeye (yoksa panele) odaklan.
    (getFocusable()[0] ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;

      const els = getFocusable();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [active, onEscape]);

  return ref;
}
