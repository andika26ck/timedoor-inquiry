import * as React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"

export const metadata: Metadata = {
  title: "Timedoor Academy — Inquiry",
  description: "Inquiry management redesign (mockup)",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="main">
            <Topbar />
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
