'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

type Note = {
  id: string
  note_text: string
  created_at: string
  updated_at: string
  edited: boolean
  edited_at: string | null
  created_by: string | null
}

export default function NotesTab({ matterId }: { matterId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newNoteText, setNewNoteText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchNotes()
    subscribeToChanges()
  }, [matterId])

  const fetchNotes = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matter_notes')
        .select('*')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToChanges = () => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`notes-${matterId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'matter_notes',
          filter: `matter_id=eq.${matterId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as Note, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new as Note : n))
            )
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matter_notes')
        .insert([{
          matter_id: matterId,
          note_text: newNoteText
        }])
        .select()

      if (error) {
        console.error('Full error object:', error)
        throw error
      }
      
      setNewNoteText('')
    } catch (error: any) {
      console.error('Error adding note:', error)
      alert(`Failed to add note: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editText.trim()) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('matter_notes')
        .update({
          note_text: editText,
          edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', noteId)

      if (error) throw error
      setEditingId(null)
      setEditText('')
    } catch (error: any) {
      console.error('Error updating note:', error)
      alert(error.message || 'Failed to update note')
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('matter_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting note:', error)
      alert(error.message || 'Failed to delete note')
    }
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditText(note.note_text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const formatText = (text: string, format: 'bold' | 'bullet') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)

    let newText = text
    if (format === 'bold') {
      newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end)
    } else if (format === 'bullet') {
      const lines = text.split('\n')
      const startLine = text.substring(0, start).split('\n').length - 1
      lines[startLine] = '• ' + lines[startLine]
      newText = lines.join('\n')
    }

    setNewNoteText(newText)
  }

  const renderFormattedText = (text: string) => {
    // Convert **text** to bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Convert lines starting with • to bullet points
    formatted = formatted.split('\n').map(line => {
      if (line.trim().startsWith('•')) {
        return `<li class="ml-4">${line.substring(1).trim()}</li>`
      }
      return line
    }).join('\n')

    return formatted
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading notes...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Note Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
        <form onSubmit={handleAddNote} className="space-y-3">
          {/* Formatting Toolbar */}
          <div className="flex gap-2 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => formatText(newNoteText, 'bold')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 font-bold"
              title="Bold (wrap text with **)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => formatText(newNoteText, 'bullet')}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              title="Bullet point (add • at start of line)"
            >
              • List
            </button>
            <span className="ml-auto text-xs text-gray-500 self-center">
              Use **text** for bold, • for bullets
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Enter your note here..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <button
            type="submit"
            disabled={!newNoteText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            Add Note
          </button>
        </form>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-600">Add your first note to track case updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              {editingId === note.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {note.created_by || 'User'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(note.created_at)}
                        </span>
                        {note.edited && (
                          <span className="text-xs text-gray-400 italic">
                            (edited {note.edited_at ? formatDate(note.edited_at) : ''})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    className="text-gray-900 whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(note.note_text) }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}