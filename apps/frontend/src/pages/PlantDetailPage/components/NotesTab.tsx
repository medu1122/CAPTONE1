import React, { useState, useRef } from 'react'
import { PlusIcon, CalendarIcon, ImageIcon, XIcon, Loader2Icon } from 'lucide-react'
import type { PlantBox, PlantNote } from '../../MyPlantsPage/types/plantBox.types'
import { uploadImage } from '../../PlantAnalysisPage/services/analysisService'
interface NotesTabProps {
  plantBox: PlantBox
  onAddNote: (note: Omit<PlantNote, '_id' | 'date'>) => void
}
export const NotesTab: React.FC<NotesTabProps> = ({ plantBox, onAddNote }) => {
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState<{
    type: PlantNote['type']
    content: string
    imageUrl?: string
  }>({
    type: 'care',
    content: '',
    imageUrl: undefined,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const notes = plantBox.notes || []
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const imageUrl = await uploadImage(file)
      setNewNote({ ...newNote, imageUrl })
      setImagePreview(URL.createObjectURL(file))
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert('Không thể upload hình ảnh. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setNewNote({ ...newNote, imageUrl: undefined })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddNote = () => {
    if (!newNote.content.trim()) return
    onAddNote({
      type: newNote.type,
      content: newNote.content,
      imageUrl: newNote.imageUrl,
    })
    setNewNote({
      type: 'care',
      content: '',
      imageUrl: undefined,
    })
    setImagePreview(null)
    setShowAddNote(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh (tùy chọn)
              </label>
              {imagePreview || newNote.imageUrl ? (
                <div className="relative">
                  <img
                    src={imagePreview || newNote.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="note-image-upload"
                  />
                  <label
                    htmlFor="note-image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2Icon size={24} className="animate-spin text-green-600" />
                        <span className="text-sm text-gray-600">Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Click để chọn hình ảnh</span>
                        <span className="text-xs text-gray-500">(Tối đa 5MB)</span>
                      </>
                    )}
                  </label>
                </div>
              )}
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
              <p className="text-sm text-gray-900 mb-2">{note.content}</p>
              {note.imageUrl && (
                <img
                  src={note.imageUrl}
                  alt="Note attachment"
                  className="w-full max-w-md h-auto rounded-lg border border-gray-200"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
