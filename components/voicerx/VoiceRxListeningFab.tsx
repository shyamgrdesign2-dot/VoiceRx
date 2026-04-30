"use client"

import type { CSSProperties } from "react"
import { Check, Mic } from "lucide-react"

import { cn } from "@/lib/utils"

const FAB_VIEWBOX = "0 0 363 115"
const FAB_PATH =
  "M333.676 23.6125C321.952 31.5666 309.684 41.5232 304.635 55.4195C297.714 74.3548 288.001 86.7689 269.714 86.769H93.2861C74.9989 86.7689 65.2863 74.3548 58.3652 55.4195C53.3163 41.5232 41.048 31.5666 29.3242 23.6125L24 20H339L333.676 23.6125Z"

const SPECTRUM_BARS = [16, 10, 14, 24, 12, 18, 32, 14, 10, 12, 16, 11, 8]

type VoiceRxListeningFabProps = {
  className?: string
  timerLabel?: string
  statusLabel?: string
}

export function VoiceRxListeningFab({
  className,
  timerLabel = "1:02",
  statusLabel = "I'm listening",
}: VoiceRxListeningFabProps) {
  return (
    <div
      className={cn("relative w-full max-w-[733px]", className)}
      style={{ aspectRatio: "363 / 115" }}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox={FAB_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <filter
            id="voice-rx-fab-shadow"
            x="0"
            y="0"
            width="363"
            height="114.769"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="12" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.175838 0 0 0 0 0.173404 0 0 0 0 0.173404 0 0 0 0.42 0"
            />
            <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_2259_30464" />
            <feBlend in="SourceGraphic" in2="effect1_dropShadow_2259_30464" result="shape" />
          </filter>
          <linearGradient
            id="voice-rx-fab-fill"
            x1="24"
            y1="53.3845"
            x2="339"
            y2="53.3845"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#402753" />
            <stop offset="1" stopColor="#1A1021" />
          </linearGradient>
          <linearGradient
            id="voice-rx-fab-sheen"
            x1="181.5"
            y1="20"
            x2="181.5"
            y2="86.769"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g filter="url(#voice-rx-fab-shadow)">
          <path d={FAB_PATH} fill="url(#voice-rx-fab-fill)" />
          <path d={FAB_PATH} fill="url(#voice-rx-fab-sheen)" opacity="0.55" />
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{
          clipPath: `path('${FAB_PATH}')`,
          WebkitClipPath: `path('${FAB_PATH}')`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-15%,rgba(205,151,255,0.14),transparent_48%)]" />
        <div className="absolute inset-x-[4.5%] top-[17.4%] h-px bg-white/12" />
      </div>

      <div
        className="absolute inset-0 flex items-center justify-between px-[11.4%] py-[18%]"
        style={{
          clipPath: `path('${FAB_PATH}')`,
          WebkitClipPath: `path('${FAB_PATH}')`,
        }}
      >
        <div className="flex h-[24.8%] w-[14.8%] min-h-[52px] min-w-[52px] items-center justify-center rounded-full bg-[#FFF4E6] shadow-[0_10px_24px_rgba(14,8,22,0.22)]">
          <div className="flex h-[54%] w-[54%] items-center justify-center rounded-full bg-[#F28A00] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <Mic className="h-[58%] w-[58%]" strokeWidth={2.4} />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start justify-center px-[4.6%]">
          <div className="flex w-full items-center gap-[2.2%]">
            <div className="flex min-w-0 flex-1 items-end gap-[1.55%]">
              {SPECTRUM_BARS.map((height, index) => {
                const style = {
                  height: `${height}px`,
                  animationDelay: `${index * 90}ms`,
                  animationDuration: `${1.28 + (index % 4) * 0.14}s`,
                } as CSSProperties

                return (
                  <span
                    key={`${height}-${index}`}
                    className="voice-rx-spectrum-bar w-[3.55%] min-w-[3px] rounded-full bg-white/92 shadow-[0_0_10px_rgba(255,255,255,0.08)]"
                    style={style}
                  />
                )
              })}
            </div>
            <span className="shrink-0 text-[clamp(18px,2.8vw,31px)] font-semibold tracking-[-0.03em] text-white/80">
              {timerLabel}
            </span>
          </div>

          <div className="mt-[4.4%] flex items-center gap-1 text-[clamp(20px,3.2vw,38px)] leading-none text-white/86">
            <span className="font-[family:var(--font-heading)] font-medium tracking-[-0.045em]">
              {statusLabel}
            </span>
            <span className="voice-rx-dots flex items-center gap-[5px] text-[#BA9DCA]">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>

        <div className="flex h-[26.8%] w-[16.1%] min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#C898FF_0%,#8B59F7_52%,#4A39C9_100%)] shadow-[0_18px_30px_rgba(38,18,65,0.36),inset_0_1px_0_rgba(255,255,255,0.24)]">
          <Check className="h-[44%] w-[44%] text-white" strokeWidth={3.1} />
        </div>
      </div>

      <style jsx>{`
        .voice-rx-spectrum-bar {
          transform-origin: center bottom;
          animation-name: voice-rx-spectrum-breathe;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .voice-rx-dots span {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.22;
          animation: voice-rx-dot-pulse 1.35s infinite ease-in-out;
        }

        .voice-rx-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .voice-rx-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes voice-rx-spectrum-breathe {
          0%,
          100% {
            opacity: 0.42;
            transform: scaleY(0.52);
          }
          35% {
            opacity: 1;
            transform: scaleY(1);
          }
          70% {
            opacity: 0.74;
            transform: scaleY(0.7);
          }
        }

        @keyframes voice-rx-dot-pulse {
          0%,
          100% {
            opacity: 0.24;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-1px);
          }
        }
      `}</style>
    </div>
  )
}
