'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Contact = {
  id: string
  name: string
  relation_to_case: string
  address: string | null
  email: string | null
  phone: string | null
  description: string | null
  is_plaintiff: boolean
  is_defendant: boolean
  created_at: string
}

export default function ContactsTab({ matterId }: { matterId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    relation_to_case: '',
    address: '',
    email: '',
    phone: '',
    description: '',
    is_plaintiff: false,
    is_defendant: false
  })

  useEffect(() => {
    fetchContacts()
    subscribeToChanges()
  }, [matterId])

  const fetchContacts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matter_contacts')
        .select('*')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToChanges = () => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`contacts-${matterId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'matter_contacts',
          filter: `matter_id=eq.${matterId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setContacts(prev => [...prev, payload.new as Contact])
          } else if (payload.eventType === 'UPDATE') {
            setContacts(prev =>
              prev.map(c => (c.id === payload.new.id ? payload.new as Contact : c))
            )
          } else if (payload.eventType === 'DELETE') {
            setContacts(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = createClient()

      if (editingId) {
        // Update existing contact
        const { error } = await supabase
          .from('matter_contacts')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
        setEditingId(null)
      } else {
        // Create new contact
        const { error } = await supabase
          .from('matter_contacts')
          .insert([{ ...formData, matter_id: matterId }])

        if (error) throw error
      }

      // Reset form
      setFormData({
        name: '',
        relation_to_case: '',
        address: '',
        email: '',
        phone: '',
        description: '',
        is_plaintiff: false,
        is_defendant: false
      })
      setIsAdding(false)
    } catch (error: any) {
      console.error('Error saving contact:', error)
      alert(error.message || 'Failed to save contact')
    }
  }

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      relation_to_case: contact.relation_to_case || '',
      address: contact.address || '',
      email: contact.email || '',
      phone: contact.phone || '',
      description: contact.description || '',
      is_plaintiff: contact.is_plaintiff,
      is_defendant: contact.is_defendant
    })
    setEditingId(contact.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('matter_contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      alert(error.message || 'Failed to delete contact')
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
      relation_to_case: '',
      address: '',
      email: '',
      phone: '',
      description: '',
      is_plaintiff: false,
      is_defendant: false
    })
  }

  // Sort contacts: Plaintiff first, Defendant second, rest alphabetically
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.is_plaintiff) return -1
    if (b.is_plaintiff) return 1
    if (a.is_defendant) return -1
    if (b.is_defendant) return 1
    return a.name.localeCompare(b.name)
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading contacts...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Contact Form */}
      {isAdding ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Contact' : 'Add Contact'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relation to Case
                </label>
                <input
                  type="text"
                  value={formData.relation_to_case}
                  onChange={(e) => setFormData({ ...formData, relation_to_case: e.target.value })}
                  placeholder="e.g., Witness, Expert, Insurance Adjuster"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description/Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_plaintiff}
                    onChange={(e) => setFormData({ ...formData, is_plaintiff: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Plaintiff</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_defendant}
                    onChange={(e) => setFormData({ ...formData, is_defendant: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Defendant</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingId ? 'Update Contact' : 'Add Contact'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
        >
          + Add Contact
        </button>
      )}

      {/* Contacts List */}
      {sortedContacts.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
          <p className="text-gray-600">Add contacts related to this matter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedContacts.map(contact => (
            <div
              key={contact.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {contact.name}
                    {contact.is_plaintiff && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        Plaintiff
                      </span>
                    )}
                    {contact.is_defendant && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                        Defendant
                      </span>
                    )}
                  </h3>
                  {contact.relation_to_case && (
                    <p className="text-sm text-gray-600">{contact.relation_to_case}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contact)}
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
                    onClick={() => handleDelete(contact.id)}
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

              <div className="space-y-2 text-sm">
                {contact.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                      {contact.phone}
                    </a>
                  </div>
                )}

                {contact.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{contact.address}</span>
                  </div>
                )}

                {contact.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">{contact.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}