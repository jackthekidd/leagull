'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

import ContactsTab from './ContactsTab'
import NotesTab from './NotesTab'

type Tab = 'info' | 'notes' | 'time' | 'payment' | 'contacts' | 'email' | 'docs'

export default function MatterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const matterId = params.id as string

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [matter, setMatter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (matterId) {
      fetchMatter()
    }
  }, [matterId])

  const fetchMatter = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matters')
        .select('*')
        .eq('id', matterId)
        .single()

      if (error) throw error
      setMatter(data)
    } catch (error) {
      console.error('Error fetching matter:', error)
      router.push('/cases')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matter...</p>
        </div>
      </div>
    )
  }

  if (!matter) {
    return null
  }

  const tabs = [
    { id: 'info' as Tab, label: 'Matter Info' },
    { id: 'notes' as Tab, label: 'Notes' },
    { id: 'time' as Tab, label: 'Time Entry' },
    { id: 'payment' as Tab, label: 'Payment Tracking' },
    { id: 'contacts' as Tab, label: 'Relationships/Contacts' },
    { id: 'email' as Tab, label: 'Gmail Integration' },
    { id: 'docs' as Tab, label: 'Google Docs' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => router.push('/cases')}
              className="text-blue-600 hover:text-blue-700 mb-3 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{matter.matter_name}</h1>
            <p className="text-gray-600">{matter.matter_type}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'info' && <MatterInfoTab matter={matter} onUpdate={fetchMatter} />}
        {activeTab === 'notes' && <NotesTab matterId={matterId} />}
        {activeTab === 'time' && <TimeEntryTab matterId={matterId} matter={matter} />}
        {activeTab === 'payment' && <PaymentTrackingTab matterId={matterId} />}
        {activeTab === 'contacts' && <ContactsTab matterId={matterId} />}
        {activeTab === 'email' && <EmailTab matterId={matterId} matter={matter} />}
        {activeTab === 'docs' && <DocsTab matterId={matterId} matter={matter} />}
      </div>
    </div>
  )
}

// Matter Info Tab Component
function MatterInfoTab({ matter, onUpdate }: { matter: any; onUpdate: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Matter Information</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Edit
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Matter Name</label>
          <p className="text-gray-900">{matter.matter_name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Matter Type</label>
          <p className="text-gray-900">{matter.matter_type || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
          <p className="text-gray-900 capitalize">{matter.status}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Payment Type</label>
          <p className="text-gray-900">{matter.matter_rate_type || 'N/A'}</p>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-6">More fields coming based on client specifications...</p>
    </div>
  )
}


// Time Entry Tab Component
function TimeEntryTab({ matterId, matter }: { matterId: string; matter: any }) {
  return (
    <div className="space-y-6">
      {/* Payment Type Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-900">Payment Type:</span>
          <span className="text-blue-700">{matter.matter_rate_type || 'Not Set'}</span>
          {matter.matter_rate_amount && (
            <span className="text-blue-700">
              - ${matter.matter_rate_amount}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Time Tracking</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Time Entry
          </button>
        </div>
        <p className="text-gray-500">Time entry functionality coming next...</p>
      </div>
    </div>
  )
}

// Payment Tracking Tab Component
function PaymentTrackingTab({ matterId }: { matterId: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Tracking</h2>
      <p className="text-gray-500">Payment tracking (barebones) - awaiting client specifications...</p>
    </div>
  )
}


// Email Tab Component
function EmailTab({ matterId, matter }: { matterId: string; matter: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Gmail Integration</h2>
      <p className="text-gray-500">Gmail integration - auto-search for "{matter.matter_name}" - coming next...</p>
    </div>
  )
}

// Docs Tab Component
function DocsTab({ matterId, matter }: { matterId: string; matter: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Google Docs</h2>
      {matter.google_drive_folder_url ? (
        <div>
          <p className="text-gray-600 mb-4">
            Folder: {matter.matter_name}-{matter.matter_type}
          </p>
          <a
            href={matter.google_drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            Open Google Drive Folder →
          </a>
        </div>
      ) : (
        <p className="text-gray-500">Google Drive folder will be created automatically - coming next...</p>
      )}
    </div>
  )
}