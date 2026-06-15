'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner, Avatar } from '@/app/components/ui'

interface Request {
  id: string
  subject: string
  description: string | null
  type: string
  priority: string
  status: string
  client_name: string
  assigned_to_name: string | null
  created_at: string
}

export default function RequestsPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRequest, setNewRequest] = useState({
    subject: '',
    description: '',
    type: 'general',
    priority: 'medium',
  })

  useEffect(() => {
    async function fetchRequests() {
      if (!weberUser?.organization_id) return

      let query = supabase
        .from('customer_requests')
        .select(`
          id, subject, description, type, priority, status, created_at,
          clients!inner(name),
          assignee:users!left(full_name)
        `)
        .eq('organization_id', weberUser.organization_id)

      // Clients can only see their own requests
      if (weberUser.role === 'client') {
        query = query.eq('client_id', weberUser.id)
      }

      const { data } = await query.order('created_at', { ascending: false })

      setRequests(data?.map(r => ({
        id: r.id,
        subject: r.subject,
        description: r.description,
        type: r.type,
        priority: r.priority,
        status: r.status,
        client_name: (r.clients as any)?.name || 'Unknown',
        assigned_to_name: (r.assignee as any)?.[0]?.full_name || null,
        created_at: r.created_at,
      })) || [])
      setLoading(false)
    }

    fetchRequests()
  }, [weberUser])

  const handleCreateRequest = async () => {
    if (!weberUser?.organization_id || !weberUser?.client_id) return

    const { error } = await supabase.from('customer_requests').insert({
      subject: newRequest.subject,
      description: newRequest.description || null,
      type: newRequest.type,
      priority: newRequest.priority,
      status: 'new',
      client_id: weberUser.client_id,
      organization_id: weberUser.organization_id,
      created_by: weberUser.id,
    })

    if (!error) {
      setShowCreateModal(false)
      setNewRequest({ subject: '', description: '', type: 'general', priority: 'medium' })
      window.location.reload()
    }
  }

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from('customer_requests').update({ status }).eq('id', id)
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  const statusCounts = {
    new: requests.filter(r => r.status === 'new').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
    closed: requests.filter(r => r.status === 'closed').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Customer Requests</h1>
          <p className="text-[#757575] mt-1">Track and manage customer inquiries</p>
        </div>
        {(weberUser?.role === 'client') && (
          <Button onClick={() => setShowCreateModal(true)}>+ New Request</Button>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatusCard label="New" count={statusCounts.new} color="#1976D2" />
        <StatusCard label="Assigned" count={statusCounts.assigned} color="#FF9800" />
        <StatusCard label="In Progress" count={statusCounts.in_progress} color="#9C27B0" />
        <StatusCard label="Resolved" count={statusCounts.resolved} color="#4CAF50" />
        <StatusCard label="Closed" count={statusCounts.closed} color="#757575" />
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#757575]">No requests yet</p>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <tr>
                <th className="text-left p-4 font-medium text-[#757575]">Request</th>
                <th className="text-left p-4 font-medium text-[#757575]">Type</th>
                <th className="text-left p-4 font-medium text-[#757575]">Client</th>
                <th className="text-left p-4 font-medium text-[#757575]">Assigned To</th>
                <th className="text-left p-4 font-medium text-[#757575]">Priority</th>
                <th className="text-left p-4 font-medium text-[#757575]">Status</th>
                <th className="text-left p-4 font-medium text-[#757575]">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="p-4">
                    <p className="font-medium text-[#212121]">{request.subject}</p>
                    {request.description && (
                      <p className="text-sm text-[#757575] truncate max-w-xs">{request.description}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="default" className="capitalize">{request.type}</Badge>
                  </td>
                  <td className="p-4 text-[#757575]">{request.client_name}</td>
                  <td className="p-4">
                    {request.assigned_to_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={request.assigned_to_name} size="sm" />
                        <span className="text-sm">{request.assigned_to_name}</span>
                      </div>
                    ) : (
                      <span className="text-[#9E9E9E]">Unassigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={getPriorityVariant(request.priority)}>{request.priority}</Badge>
                  </td>
                  <td className="p-4">
                    {(weberUser?.role === 'admin' || weberUser?.role === 'team_member') ? (
                      <select
                        value={request.status}
                        onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                        className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                      >
                        <option value="new">New</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    ) : (
                      <Badge variant={getStatusVariant(request.status)}>{request.status.replace('_', ' ')}</Badge>
                    )}
                  </td>
                  <td className="p-4 text-[#757575] text-sm">
                    {new Date(request.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Request Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Request">
        <div className="space-y-4">
          <Input
            label="Subject"
            value={newRequest.subject}
            onChange={v => setNewRequest({ ...newRequest, subject: v })}
            placeholder="Brief description of your request"
          />
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Description</label>
            <textarea
              value={newRequest.description}
              onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
              placeholder="Detailed description of your request"
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] resize-none"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#757575] mb-1">Type</label>
              <select
                value={newRequest.type}
                onChange={e => setNewRequest({ ...newRequest, type: e.target.value })}
                className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
              >
                <option value="support">Support</option>
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#757575] mb-1">Priority</label>
              <select
                value={newRequest.priority}
                onChange={e => setNewRequest({ ...newRequest, priority: e.target.value })}
                className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateRequest}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <div>
        <p className="text-2xl font-bold text-[#212121]">{count}</p>
        <p className="text-sm text-[#757575]">{label}</p>
      </div>
    </Card>
  )
}

function getPriorityVariant(priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default',
  }
  return map[priority] || 'default'
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    new: 'info',
    assigned: 'warning',
    in_progress: 'info',
    resolved: 'success',
    closed: 'default',
  }
  return map[status] || 'default'
}