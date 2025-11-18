import React, { useState } from 'react'
import { PlusIcon, CalendarIcon } from 'lucide-react'
import type { PlantBox, PlantNote } from '../../MyPlantsPage/types/plantBox.types'
interface NotesTabProps {
  plantBox: PlantBox
  onAddNote: (note: Omit<PlantNote, '_id' | 'date'>) => void
}
export const NotesTab: React.FC<NotesTabProps> = ({ plantBox, onAddNote }) => {
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState<{
    type: PlantNote['type']
    content: string
  }>({
    type: 'care',
    content: '',
  })
  const notes = plantBox.notes || []
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const handleAddNote = () => {
    if (!newNote.content.trim()) return
    onAddNote({
      type: newNote.type,
      content: newNote.content,
    })
    setNewNote({
      type: 'care',
      content: '',
    })
    setShowAddNote(false)
  }
  const getTypeBadge = (type: PlantNote['type']) => {
    const badges = {
      care: {
        label: 'Care',
        bg: 'bg-blue-100',
        color: 'text-blue-700',
      },
      observation: {
        label: 'Observation',
        bg: 'bg-purple-100',
        color: 'text-purple-700',
      },
      issue: {
        label: 'Issue',
        bg: 'bg-red-100',
        color: 'text-red-700',
      },
      milestone: {
        label: 'Milestone',
        bg: 'bg-green-100',
        color: 'text-green-700',
      },
    }
    return badges[type]
  }
  if (notes.length === 0 && !showAddNote) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Chưa có ghi chú nào
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Bắt đầu ghi lại quá trình chăm sóc cây
        </p>
        <button
          onClick={() => setShowAddNote(true)}
          className="px-6 py-3 bg-green-600 text-white text-base font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Thêm ghi chú đầu tiên
        </button>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">📝 Notes</h2>
        <button
          onClick={() => setShowAddNote(!showAddNote)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon size={16} />
          <span>Thêm note</span>
        </button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(['care', 'observation', 'issue', 'milestone'] as const).map(
                  (type) => {
                    const badge = getTypeBadge(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setNewNote({
                            ...newNote,
                            type,
                          })
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${newNote.type === type ? `${badge.bg} ${badge.color}` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {badge.label}
                      </button>
                    )
                  },
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({
                    ...newNote,
                    content: e.target.value,
                  })
                }
                placeholder="Nhập ghi chú..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!newNote.content.trim()}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => {
          const badge = getTypeBadge(note.type)
          return (
            <div
              key={note._id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 ${badge.bg} ${badge.color} text-xs font-medium rounded`}
                  >
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <CalendarIcon size={12} />
                    <span>{formatDate(note.date)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-900">{note.content}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
