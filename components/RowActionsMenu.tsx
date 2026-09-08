"use client"
import * as React from "react"
import {
  IconEye,
  IconEdit,
  IconSwap,
  IconGraduation,
  IconTrash,
  IconChevronRight,
} from "./Icons"

export default function RowActionsMenu({
  onView,
  onEdit,
  onChangeStatus,
  onRegister,
  onDelete,
}: {
  onView?: () => void
  onEdit?: () => void
  onChangeStatus?: () => void
  onRegister?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="menu" role="menu" onClick={(e) => e.stopPropagation()}>
      <div className="menu-label">Actions</div>
      <button className="menu-item" onClick={onView}>
        <IconEye size={16} /> View detail
      </button>
      <button className="menu-item" onClick={onEdit}>
        <IconEdit size={16} /> Edit inquiry
      </button>
      <button className="menu-item" onClick={onChangeStatus}>
        <IconSwap size={16} /> Change status
        <IconChevronRight size={15} className="chev-r" />
      </button>
      <button className="menu-item" onClick={onRegister}>
        <IconGraduation size={16} /> Mark as Registered
      </button>
      <div className="menu-divider" />
      <button className="menu-item danger" onClick={onDelete}>
        <IconTrash size={16} /> Delete
      </button>
    </div>
  )
}
