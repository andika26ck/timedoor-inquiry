import * as React from "react"
import {
  IconHome,
  IconUsers,
  IconGrid,
  IconBook,
  IconCalendar,
  IconChart,
  IconSettings,
  IconChevronDown,
} from "./Icons"

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
          </svg>
        </div>
        <div className="brand-name">
          <span className="b1">timedoor</span>
          <span className="b2">academy</span>
        </div>
      </div>

      <div className="nav-section-label">Main</div>
      <nav className="nav">
        <button className="nav-item">
          <IconHome size={18} /> Dashboard
        </button>
        <button className="nav-item">
          <IconGrid size={18} /> Class
        </button>
        <button className="nav-item">
          <IconBook size={18} /> Course
        </button>
      </nav>

      <div className="nav-section-label">Customer</div>
      <nav className="nav">
        <button className="nav-item active">
          <IconUsers size={18} /> Inquiry
          <span className="badge">15</span>
        </button>
        <button className="nav-item">
          <IconUsers size={18} /> Student
        </button>
        <button className="nav-item">
          <IconUsers size={18} /> Parent
        </button>
      </nav>

      <div className="nav-section-label">Operations</div>
      <nav className="nav">
        <button className="nav-item">
          <IconCalendar size={18} /> Schedule
        </button>
        <button className="nav-item">
          <IconChart size={18} /> Report
        </button>
        <button className="nav-item">
          <IconSettings size={18} /> Settings
        </button>
      </nav>
    </aside>
  )
}
