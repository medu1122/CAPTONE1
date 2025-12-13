import React, { useEffect, useRef } from 'react'
import { PlusIcon, MenuIcon, TrashIcon, XIcon } from 'lucide-react'
import type { Conversation } from '../hooks/useChatHistory'

interface HistorySidebarProps {
  collapsed: boolean
  open: boolean
  onToggleRail: () => void
  onOpen: () => void
  onClose: () => void
  items: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => Promise<string>
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void | Promise<void>
  onClear: () => void
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  open,
  onOpen,
  onClose,
  items,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onClear,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle focus trap
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusableElements = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement
    if (firstElement) {
      firstElement.focus()
    }
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
    panel.addEventListener('keydown', handleTabKey)
    return () => panel.removeEventListener('keydown', handleTabKey)
  }, [open])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current === e.target) {
        onClose()
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open, onClose])

  // Return focus to toggle button when closing
  useEffect(() => {
    if (!open && toggleButtonRef.current) {
      toggleButtonRef.current.focus()
    }
  }, [open])

  const handleCreateNew = async () => {
    const id = await onCreate()
    onSelect(id)
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  const handleRename = async (id: string, e: React.FocusEvent<HTMLSpanElement>) => {
    const newTitle = e.target.textContent?.trim() || 'Cuộc chat mới'
    // Only rename if title actually changed
    const item = items.find(i => i.id === id)
    if (item && item.title !== newTitle) {
      await onRename(id, newTitle)
    }
  }

  return (
    <>
      {/* Rail (desktop only) */}
      <div className="relative z-10 w-14 hidden md:flex flex-col border-r bg-white">
        <div className="flex flex-col items-center p-2 space-y-4">
          <button
            onClick={handleCreateNew}
            className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white"
            aria-label="Cuộc chat mới"
          >
            <PlusIcon size={20} />
          </button>
          <button
            ref={toggleButtonRef}
            onClick={onOpen}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            aria-label="Mở lịch sử chat"
          >
            <MenuIcon size={20} />
          </button>
          <button
            onClick={onClear}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center mt-auto"
            aria-label="Xóa tất cả lịch sử"
          >
            <TrashIcon size={20} />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 flex"
          aria-modal="true"
          role="dialog"
        >
          <div
            ref={overlayRef}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className={`
              relative w-72 h-screen bg-white shadow-xl overflow-y-auto
              transition-transform duration-200 ease-out
              ${open ? 'translate-x-0' : '-translate-x-full'}
              md:w-72 fixed inset-y-0 left-0 max-w-sm z-40
            `}
          >
            <div className="p-4 flex items-center justify-between border-b">
              <h2 className="font-medium">Lịch sử chat</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Đóng lịch sử"
              >
                <XIcon size={20} />
              </button>
            </div>
            <div className="p-4">
              <button
                onClick={handleCreateNew}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <PlusIcon size={16} />
                <span>Cuộc chat mới</span>
              </button>
            </div>
            <div className="px-2">
              {items.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Chưa có cuộc trò chuyện nào
                </div>
              ) : (
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div
                        className={`
                          p-3 rounded-lg cursor-pointer flex justify-between items-start
                          ${activeId === item.id ? 'bg-green-50 border-l-4 border-green-600' : 'hover:bg-gray-100'}
                        `}
                        onClick={() => onSelect(item.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <span
                            className="font-medium block truncate"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleRename(item.id, e)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                e.currentTarget.blur()
                              }
                            }}
                          >
                            {item.title}
                          </span>
                          <span className="text-xs text-gray-500 block truncate">
                            {item.snippet || 'Không có tin nhắn'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(item.id)
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                          aria-label="Xóa cuộc trò chuyện"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile toggle button (visible only on mobile) */}
      <button
        className="md:hidden fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-green-600 text-white shadow-lg flex items-center justify-center"
        onClick={onOpen}
        aria-label="Mở lịch sử chat"
      >
        <MenuIcon size={24} />
      </button>
    </>
  )
}

