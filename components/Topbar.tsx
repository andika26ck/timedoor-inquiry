import * as React from "react"
import { IconChevronDown, IconGlobe, IconBell } from "./Icons"

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="branch-select">
        <span className="lab">BRANCH</span>
        <span className="val">
          HQ Training <IconChevronDown size={15} />
        </span>
      </div>
      <div className="tz-select">
        <IconGlobe size={16} /> GMT+8 · Asia/Singapore <IconChevronDown size={14} />
      </div>
      <button className="icon-btn" aria-label="Notifications">
        <IconBell size={18} />
      </button>
      <div className="avatar">AC</div>
    </header>
  )
}
