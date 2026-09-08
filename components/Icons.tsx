import * as React from "react"

type P = { size?: number; className?: string; strokeWidth?: number }

function base(size = 18, strokeWidth = 2) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
}

export const IconSearch = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)
export const IconChevronDown = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)
export const IconChevronRight = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)
export const IconPlus = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconCheck = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
export const IconX = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)
export const IconDots = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
)
export const IconEdit = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)
export const IconEye = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const IconTrash = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
)
export const IconSwap = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M7 4l-4 4 4 4" />
    <path d="M3 8h13a4 4 0 0 1 4 4v0" />
    <path d="M17 20l4-4-4-4" />
    <path d="M21 16H8a4 4 0 0 1-4-4v0" />
  </svg>
)
export const IconGraduation = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
  </svg>
)
export const IconUpload = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M12 3v13M7 8l5-5 5 5" />
  </svg>
)
export const IconDownload = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M12 16V3M7 11l5 5 5-5" />
  </svg>
)
export const IconBell = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)
export const IconGlobe = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
)
export const IconHome = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
)
export const IconUsers = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
export const IconGrid = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
export const IconBook = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 5v14" />
  </svg>
)
export const IconCalendar = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
)
export const IconChart = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 3 3 5-6" />
  </svg>
)
export const IconSettings = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
)
export const IconAlert = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)
export const IconInfo = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </svg>
)
export const IconClock = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
export const IconFile = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
)
export const IconPhone = ({ size, className, strokeWidth }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
)
