'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NewCasePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    matter_name: '',
    contact_name: '',
    opponent: '',
    status: 'open',
    matter_type: '',
    matter_rate_type: 'flat rate',
    matter_rate_amount: '',
    open_date: new Date().toISOString().split('T')[0],
    close_date: '',
    statute_of_limitations_date: '',
    evergreen: 0,
    paid: '',
    invoices_due: '',
    unapplied_amount: '',
    trust_balance: '',
    operating_balance: '',
    billable_amount: '',
    opposing_attorney: '',
    property_address: '',
    tags: ''
  })

  const matterTypes = [
    'RE-Purchase',
    'RE-Sale',
    'RE-QCD',
    'Probate Matter',
    'Civil-Contract',
    'Traffic',
    'Last Will and Testament',
    'PI-Auto',
    'PI-Animal Control Act',
    'Medical Malpractice',
    'Civil-OOP',
    'Workers Compensation'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Convert financial fields to numbers
      const caseData = {
        matter_name: formData.matter_name,
        contact_name: formData.contact_name || null,
        opponent: formData.opponent || null,
        status: formData.status,
        matter_type: formData.matter_type || null,
        matter_rate_type: formData.matter_rate_type,
        matter_rate_amount: formData.matter_rate_amount ? parseFloat(formData.matter_rate_amount) : null,
        open_date: formData.open_date || null,
        close_date: formData.close_date || null,
        statute_of_limitations_date: formData.statute_of_limitations_date || null,
        evergreen: formData.evergreen,
        paid: formData.paid ? parseFloat(formData.paid) : 0,
        invoices_due: formData.invoices_due ? parseFloat(formData.invoices_due) : 0,
        unapplied_amount: formData.unapplied_amount ? parseFloat(formData.unapplied_amount) : 0,
        trust_balance: formData.trust_balance ? parseFloat(formData.trust_balance) : 0,
        operating_balance: formData.operating_balance ? parseFloat(formData.operating_balance) : 0,
        billable_amount: formData.billable_amount ? parseFloat(formData.billable_amount) : 0,
        opposing_attorney: formData.opposing_attorney || null,
        property_address: formData.property_address || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      }
      
      const { data, error: insertError } = await supabase
        .from('matters')
        .insert([caseData])
        .select()

      if (insertError) throw insertError

      // Success! Redirect to case list
      router.push(`/matters/${data[0].id}?tab=contacts`)
    } catch (err: any) {
      console.error('Error creating case:', err)
      console.error('Full error object:', JSON.stringify(err, null, 2))
      
      // Better error message
      let errorMessage = 'Failed to create case. '
      
      if (err.message) {
        errorMessage += err.message
      } else if (err.error_description) {
        errorMessage += err.error_description
      } else if (err.details) {
        errorMessage += err.details
      } else {
        errorMessage += 'Please check console for details.'
      }
      
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/cases')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            Back to Cases
          </button>
          <h1 className="text-3xl font-bold text-gray-900">New Case Intake</h1>
          <p className="text-gray-600 mt-2">Fill out the information below to create a new case</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          
          {/* Basic Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="matter_name"
                  value={formData.matter_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Smith vs. Jones"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="Client name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
                <input
                  type="text"
                  name="opponent"
                  value={formData.opponent}
                  onChange={handleChange}
                  placeholder="Opposing party"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matter Type</label>
                <select
                  name="matter_type"
                  value={formData.matter_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {matterTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="close">Closed</option>
                </select>
              </div>
            </div>
          </section>

          {/* Billing Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                <select
                  name="matter_rate_type"
                  value={formData.matter_rate_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="flat rate">Flat Rate</option>
                  <option value="contingency">Contingency</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Amount ($)</label>
                <input
                  type="number"
                  name="matter_rate_amount"
                  value={formData.matter_rate_amount}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid ($)</label>
                <input
                  type="number"
                  name="paid"
                  value={formData.paid}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoices Due ($)</label>
                <input
                  type="number"
                  name="invoices_due"
                  value={formData.invoices_due}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trust Balance ($)</label>
                <input
                  type="number"
                  name="trust_balance"
                  value={formData.trust_balance}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Balance ($)</label>
                <input
                  type="number"
                  name="operating_balance"
                  value={formData.operating_balance}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Important Dates */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Open Date</label>
                <input
                  type="date"
                  name="open_date"
                  value={formData.open_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Close Date</label>
                <input
                  type="date"
                  name="close_date"
                  value={formData.close_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statute of Limitations</label>
                <input
                  type="date"
                  name="statute_of_limitations_date"
                  value={formData.statute_of_limitations_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opposing Attorney</label>
                <input
                  type="text"
                  name="opposing_attorney"
                  value={formData.opposing_attorney}
                  onChange={handleChange}
                  placeholder="Attorney name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                <input
                  type="text"
                  name="property_address"
                  value={formData.property_address}
                  onChange={handleChange}
                  placeholder="Address (if applicable)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="urgent, review, followup (comma-separated)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple tags with commas</p>
              </div>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating Case...' : 'Create Case'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/cases')}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}