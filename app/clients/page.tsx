'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner, Avatar } from '@/app/components/ui'

interface Client {
  id: string
  name: string
  company_name: string | null
  industry: string | null
  email: string
  phone: string | null
  contact_name: string | null
  project_count: number
  total_invoiced: number
  created_at: string
}

export default function ClientsPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    company_name: '',
    industry: '',
    email: '',
    phone: '',
    contact_name: '',
  })

  useEffect(() => {
    async function fetchClients() {
      if (!weberUser?.organization_id) return

      const { data } = await supabase
        .from('clients')
        .select(`
          id, name, company_name, industry, created_at
        `)
        .eq('organization_id', weberUser.organization_id)
        .eq('is_active', true)

      // Get additional stats for each client
      const clientsWithStats = await Promise.all(
        (data || []).map(async (client) => {
          const [projectsRes, invoicesRes] = await Promise.all([
            supabase.from('projects').select('id').eq('client_id', client.id),
            supabase.from('invoices').select('total').eq('client_id', client.id),
          ])

          // Get primary contact
          const { data: contact } = await supabase
            .from('contacts')
            .select('name, email, phone')
            .eq('client_id', client.id)
            .eq('is_primary', true)
            .single()

          return {
            ...client,
            email: contact?.email || '',
            phone: contact?.phone || null,
            contact_name: contact?.name || null,
            project_count: projectsRes.data?.length || 0,
            total_invoiced: invoicesRes.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0,
          }
        })
      )

      setClients(clientsWithStats)
      setLoading(false)
    }

    fetchClients()
  }, [weberUser])

  const handleCreateClient = async () => {
    if (!weberUser?.organization_id) return

    const { data: clientData, error } = await supabase
      .from('clients')
      .insert({
        name: newClient.name,
        company_name: newClient.company_name || null,
        industry: newClient.industry || null,
        is_active: true,
        organization_id: weberUser.organization_id,
      })
      .select()
      .single()

    if (!error && clientData) {
      // Add primary contact
      await supabase.from('contacts').insert({
        client_id: clientData.id,
        name: newClient.contact_name || newClient.name,
        email: newClient.email,
        phone: newClient.phone || null,
        is_primary: true,
      })

      setShowCreateModal(false)
      setNewClient({ name: '', company_name: '', industry: '', email: '', phone: '', contact_name: '' })
      window.location.reload()
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Clients</h1>
          <p className="text-[#757575] mt-1">Manage your client accounts</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ Add Client</Button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#757575] mb-4">No clients yet</p>
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>Add Your First Client</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <Avatar name={client.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#212121] truncate">{client.name}</h3>
                  {client.company_name && (
                    <p className="text-sm text-[#757575] truncate">{client.company_name}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {client.contact_name && (
                  <div className="flex items-center gap-2 text-[#757575]">
                    <span>👤</span>
                    <span>{client.contact_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#757575]">
                  <span>📧</span>
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-[#757575]">
                    <span>📞</span>
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#E0E0E0] flex justify-between text-sm">
                <div>
                  <p className="text-[#757575]">Projects</p>
                  <p className="font-medium text-[#212121]">{client.project_count}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#757575]">Total Invoiced</p>
                  <p className="font-medium text-[#212121]">${client.total_invoiced.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Client">
        <div className="space-y-4">
          <Input
            label="Client Name"
            value={newClient.name}
            onChange={v => setNewClient({ ...newClient, name: v })}
            placeholder="Individual or company name"
          />
          <Input
            label="Company Name"
            value={newClient.company_name}
            onChange={v => setNewClient({ ...newClient, company_name: v })}
            placeholder="Company (optional)"
          />
          <Input
            label="Industry"
            value={newClient.industry}
            onChange={v => setNewClient({ ...newClient, industry: v })}
            placeholder="Industry (optional)"
          />
          <div className="border-t border-[#E0E0E0] pt-4">
            <p className="text-sm font-medium text-[#757575] mb-2">Primary Contact</p>
            <Input
              label="Contact Name"
              value={newClient.contact_name}
              onChange={v => setNewClient({ ...newClient, contact_name: v })}
              placeholder="Primary contact name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={newClient.email}
              onChange={v => setNewClient({ ...newClient, email: v })}
              placeholder="contact@example.com"
            />
            <Input
              label="Phone"
              value={newClient.phone}
              onChange={v => setNewClient({ ...newClient, phone: v })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateClient}>Add Client</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}