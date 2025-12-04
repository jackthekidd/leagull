'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Matter = {
  id: string
  matter_name: string
  matter_type: string | null
  status: string
  updated_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [matters, setMatters] = useState<Matter[]>([])
  const [filteredMatters, setFilteredMatters] = useState<Matter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [matterTypeFilter, setMatterTypeFilter] = useState('all')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    fetchMatters()
    subscribeToChanges()
  }, [])

  useEffect(() => {
    filterMatters()
  }, [matters, searchTerm, statusFilter, matterTypeFilter])

  const fetchMatters = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matters')
        .select('id, matter_name, matter_type, status, updated_at')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setMatters(data || [])
    } catch (error) {
      console.error('Error fetching matters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToChanges = () => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('matters-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matters' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMatters(prev => [payload.new as Matter, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setMatters(prev =>
              prev.map(m => (m.id === payload.new.id ? payload.new as Matter : m))
            )
          } else if (payload.eventType === 'DELETE') {
            setMatters(prev => prev.filter(m => m.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const filterMatters = () => {
    let filtered = matters

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.matter_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter)
    }

    if (matterTypeFilter !== 'all') {
      filtered = filtered.filter(m => m.matter_type === matterTypeFilter)
    }

    setFilteredMatters(filtered)
  }

  const handleSearch = () => {
    filterMatters()
  }

  const uniqueMatterTypes = Array.from(
    new Set(matters.map(m => m.matter_type).filter((type): type is string => Boolean(type)))
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => router.push('/cases/new')}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              title="New Matter"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {showSearch ? 'Hide Search' : 'Search'}
            </button>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="close">Closed</option>
            </select>

            {uniqueMatterTypes.length > 0 && (
              <select
                value={matterTypeFilter}
                onChange={(e) => setMatterTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {uniqueMatterTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}
          </div>

          {showSearch && (
            <div className="flex gap-3 mt-3">
              <input
                type="text"
                placeholder="Search by matter name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          )}
        </div>

        {/* Matters List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading matters...</p>
          </div>
        ) : filteredMatters.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matters found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || matterTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first matter'}
            </p>
            {!searchTerm && statusFilter === 'all' && matterTypeFilter === 'all' && (
              <button
                onClick={() => router.push('/cases/new')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create First Matter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
            {filteredMatters.slice(0, 20).map(matter => (
              <div
                key={matter.id}
                onClick={() => router.push(`/matters/${matter.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {matter.matter_name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{matter.matter_type || 'No type'}</span>
                  <span className="text-gray-400">•</span>
                  <span>{formatDate(matter.updated_at)}</span>
                  <span
                    className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                      matter.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {matter.status}
                  </span>
                </div>
              </div>
            ))}
            {filteredMatters.length > 20 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Showing 20 of {filteredMatters.length} matters
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}