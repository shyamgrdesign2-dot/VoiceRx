/**
 * Shared primitives for all detailed section content panels.
 *
 * KEY DESIGN DECISION: SectionCard does NOT use `overflow-clip/hidden` on its
 * wrapper. This allows `position: sticky` on the card header to work correctly
 * relative to the parent scroll container. The rounded border is achieved via
 * `border` + `border-radius` only.
 */
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowSquareDown, ArrowSquareUp } from "iconsax-reactjs";
import { rxSidebarTokens, tpSectionCardStyle } from "./tokens";
import { VoiceRxModuleRecorder } from "@/components/voicerx/VoiceRxModuleRecorder";

function getNearestScrollContainer(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function useStickyHeaderState(offset = 0) {
  const headerRef = React.useRef<HTMLElement | null>(null);
  const [isStuck, setIsStuck] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const node = headerRef.current;
    if (!node) return;

    const scrollRoot =
      (node.closest('[data-sticky-scroll-root="true"]') as HTMLElement | null) ??
      getNearestScrollContainer(node);
    if (!scrollRoot) return;

    let frame = 0;

    const update = () => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const atStickyTop = nodeRect.top <= rootRect.top + offset + 0.5;
      setIsStuck(scrollRoot.scrollTop > 0 && atStickyTop);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    scrollRoot.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(scrollRoot);
    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      scrollRoot.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
    };
  }, [offset]);

  return { headerRef, isStuck };
}

// ─── Add/Edit Details button (outlined, indigo) ───────────────────────────────

export function ActionButton({
  label = "Add/Edit Details",
  icon = "plus",
  onClick,
  sectionId,
  onVoiceClick,
}: {
  label?: string;
  icon?: "plus" | "none";
  onClick?: () => void;
  /**
   * Historical-section id this button belongs to. When provided, the
   * mic trigger opens a bottom-flush voice recorder overlay inside the
   * panel (same shell as the Rx module recorder). The recorder is
   * self-contained: no `ai_trigger` signal is published, so clicking
   * the sidebar mic does NOT auto-open the Dr. Agent panel.
   */
  sectionId?: string;
  /** Escape hatch for ad-hoc voice handlers that don't want the default behaviour. */
  onVoiceClick?: () => void;
}) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Flip the global voice-lock while this panel is dictating so every
  // other interactive surface (other sidebar panels, the Rx modules, the
  // Dr. Agent "Start Consultation" button) is frozen. Recorder stays
  // interactive via its own data-voice-allow marker.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isVoiceActive) return;
    const body = document.body;
    body.setAttribute("data-voice-lock", "on");
    body.setAttribute("data-voice-module-lock", sectionId ?? "sidebar");
    return () => {
      body.removeAttribute("data-voice-lock");
      body.removeAttribute("data-voice-module-lock");
    };
  }, [isVoiceActive, sectionId]);

  const handleVoice = onVoiceClick
    ? onVoiceClick
    : sectionId
      ? () => setIsVoiceActive((v) => !v)
      : null;

  const sectionLabel = label.replace(/Add\/Edit\s*/i, "").trim() || "Details";

  return (
    <>
    {/* Bottom-flush recorder overlay — absolute to the panel's
        `relative size-full` container. Takes the lower 40% of the panel
        and uses the `stack` variant so the transcript gets real estate
        like the Dr. Agent voice active panel (vertical layout: transcript
        on top, wave + CTAs below, pill at the bottom edge). */}
    {isVoiceActive ? (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-stretch"
        style={{ height: "44%" }}
      >
        <div className="pointer-events-auto w-full" data-voice-allow>
          <VoiceRxModuleRecorder
            sectionLabel={sectionLabel}
            onCancel={() => setIsVoiceActive(false)}
            onSubmit={() => setIsVoiceActive(false)}
            radiusClassName="rounded-none"
            variant="stack"
            fillHeight
          />
        </div>
      </div>
    ) : null}
    <div className={`bg-white content-stretch flex items-center gap-[8px] p-[12px] relative shrink-0 w-full border-b ${rxSidebarTokens.panelBorderClass}`}>
      <button
        type="button"
        onClick={onClick}
        className="h-[36px] relative shrink-0 flex-1 cursor-pointer bg-transparent p-0 text-left"
      >
        <div aria-hidden="true" className="absolute border border-tp-blue-500 border-solid inset-0 pointer-events-none rounded-[10px]" />
        <div className="flex flex-row items-center justify-center size-full rounded-[10px]">
          <div className="content-stretch flex gap-[4px] items-center justify-center px-[15px] py-px relative size-full">
            {icon === "plus" && (
              <div className="relative shrink-0 size-[24px]">
                <svg className="absolute block size-full" fill="none" viewBox="0 0 24 24">
                  <path d="M6 12H18" stroke="var(--tp-blue-500)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  <path d="M12 18V6" stroke="var(--tp-blue-500)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            )}
            <p className="font-sans font-medium leading-[22px] not-italic relative shrink-0 text-tp-blue-500 text-[14px] text-center whitespace-nowrap">
              {label}
            </p>
          </div>
        </div>
      </button>
      {handleVoice ? (
        <button
          type="button"
          onClick={handleVoice}
          aria-label={`Dictate ${label}`}
          title="Dictate"
          // Keep this trigger clickable while THIS section is the one
          // dictating, so the user can toggle the recorder off. When
          // another section is active we mark `data-voice-block` so the
          // global voice-lock captures the click and surfaces the
          // "VoiceRx is active in …" tooltip instead of spawning a
          // second recorder that would conflict with the live one.
          {...(isVoiceActive
            ? { "data-voice-allow": true }
            : { "data-voice-block": true })}
          className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center transition-transform hover:scale-[1.06] active:scale-[0.94]"
        >
          {/* Naked animated-gradient wave — same pattern as the Rx module
              header mic trigger. No background, no stroke. */}
          <span className="tp-voice-wave-icon" />
        </button>
      ) : null}
    </div>
    </>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
// NO overflow-clip → sticky header works relative to scroll container.
// Rounded visual via border-radius on the outer div.

type SectionCardProps = {
  title: string;
  titleAddon?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  hideChevron?: boolean;
  children?: React.ReactNode;
};

function SectionCardHeader({
  title,
  titleAddon,
  expanded = true,
  onToggle,
  hideChevron = false,
}: {
  title: string;
  titleAddon?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  hideChevron?: boolean;
}) {
  const { headerRef, isStuck } = useStickyHeaderState();
  const HeaderTag = onToggle ? "button" : "div";
  const radiusClass = expanded
    ? isStuck
      ? "rounded-tl-none rounded-tr-none"
      : "rounded-tl-[10px] rounded-tr-[10px]"
    : "rounded-[10px]";

  return (
    <HeaderTag
      ref={headerRef as React.Ref<any>}
      type={onToggle ? "button" : undefined}
      onClick={onToggle}
      className={clsx(
        "group bg-tp-slate-100 sticky top-0 z-[2] shrink-0 w-full text-left",
        radiusClass,
        onToggle ? "cursor-pointer" : "",
      )}
    >
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[10px] py-[8px] relative w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex flex-col font-semibold justify-end leading-[0] not-italic relative shrink-0 text-tp-slate-700 ${rxSidebarTokens.bodyStrongClass}`}>
              <p className="leading-[18px] whitespace-pre-wrap">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {titleAddon && (
              <span className="opacity-0 transition-opacity group-hover/section-card:opacity-100">
                {titleAddon}
              </span>
            )}
            {!hideChevron ? (
              <div className="flex items-center justify-center relative shrink-0">
                <div className="flex-none transition-transform duration-150">
                  <div className="relative size-[18px]">
                    {expanded ? (
                      <ArrowSquareUp color="var(--tp-slate-500)" size={18} strokeWidth={1.5} variant="Linear" />
                    ) : (
                      <ArrowSquareDown color="var(--tp-slate-500)" size={18} strokeWidth={1.5} variant="Linear" />
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </HeaderTag>
  );
}

export function SectionCard({
  title,
  titleAddon,
  expanded = true,
  onToggle,
  hideChevron = false,
  children,
}: SectionCardProps) {
  return (
    <div className="group/section-card relative shrink-0 w-full" style={tpSectionCardStyle}>
      <SectionCardHeader title={title} titleAddon={titleAddon} expanded={expanded} onToggle={onToggle} hideChevron={hideChevron} />
      {expanded ? (
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          {children}
        </div>
      ) : null}
    </div>
  );
}

// ─── Scrollable section list wrapper ─────────────────────────────────────────
// overflow-y-auto here is the scroll container for sticky to work.

export function SectionScrollArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px overflow-y-auto relative w-full" data-sticky-scroll-root="true">
      <div className="content-stretch flex flex-col gap-[12px] items-center p-[12px] relative w-full">
        {children}
      </div>
    </div>
  );
}

// ─── Content row (px-10 py-6, full width) ─────────────────────────────────────

export function ContentRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[10px] py-[6px] relative w-full">
          <div className="flex-[1_0_0] min-h-px min-w-px relative">
            <div className="content-stretch flex flex-col gap-[2px] items-start justify-center relative w-full">
              <div className="font-sans font-normal text-tp-slate-700 text-[14px] leading-[20px] tracking-[0.012px] relative w-full">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

export function Grey({ children }: { children: React.ReactNode }) {
  return <span className="text-tp-slate-400">{children}</span>;
}

export function Sep() {
  return <span className="text-tp-slate-200">{" | "}</span>;
}

export function Bold({ children }: { children: React.ReactNode }) {
  return <span className={clsx("font-semibold", rxSidebarTokens.bodyStrongClass)}>{children}</span>;
}

export function Red({ children }: { children: React.ReactNode }) {
  return <span className="text-tp-error-500">{children}</span>;
}

// ─── Collapsed card (past date) ───────────────────────────────────────────────

export function CollapsedCard({ text }: { text: string }) {
  return (
    <div className="relative shrink-0 w-full" style={tpSectionCardStyle}>
      <div className="bg-tp-slate-100 relative shrink-0 w-full rounded-[10px]">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center justify-between px-[10px] py-[8px] relative w-full">
            <div className={`flex flex-col font-medium justify-end leading-[0] not-italic relative shrink-0 text-tp-slate-700 whitespace-nowrap ${rxSidebarTokens.bodyMediumClass}`}>
              <p className="leading-[18px]">{text}</p>
            </div>
            <div className="relative shrink-0 size-[18px]">
              <ArrowSquareDown color="var(--tp-slate-500)" size={18} strokeWidth={1.5} variant="Linear" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
