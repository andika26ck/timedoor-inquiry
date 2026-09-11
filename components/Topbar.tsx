import * as React from "react"
import { IconChevronDown, IconGlobe, IconBell } from "./Icons"

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="branch-select">
        <span className="lab">Branch Availability</span>
        <span className="val">
          HQ Training <IconChevronDown size={15} />
        </span>
      </div>
      <div className="tz-select">
        <IconGlobe size={16} /> GMT+8 · Asia/Singapore <IconChevronDown size={14} />
      </div>
      <button className="icon-btn" aria-label="Toggle theme">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
      <button className="icon-btn" aria-label="Notifications">
        <IconBell size={18} />
      </button>
      <div className="avatar">AC</div>
    </header>
  )
}
