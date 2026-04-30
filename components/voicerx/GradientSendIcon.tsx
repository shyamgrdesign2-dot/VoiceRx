"use client"

import { useId } from "react"

/** AI gradient send-arrow icon — shared between ChatInput send button and VoiceRx submit. */
export function GradientSendIcon({ size = 36 }: { size?: number }) {
  const gid = useId().replace(/[:]/g, "")
  const grad = `url(#gs${gid})`
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`gs${gid}`} x1="-0.0224" y1="10.3128" x2="24.0296" y2="10.365" gradientUnits="userSpaceOnUse">
          <stop offset="0.0304" stopColor="#D565EA" />
          <stop offset="0.6674" stopColor="#673AAC" />
          <stop offset="1" stopColor="#1A1994" />
        </linearGradient>
      </defs>
      <path
        d="M0 12C0 5.37258 5.37258 0 12 0V0C18.6274 0 24 5.37258 24 12V12C24 18.6274 18.6274 24 12 24V24C5.37258 24 0 18.6274 0 12V12Z"
        fill={grad}
      />
      <path
        d="M8.2063 10.4812L12 6.68745L15.7938 10.4812"
        stroke="white"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 17.3125V6.79375" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
