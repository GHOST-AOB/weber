'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner } from '@/app/components/ui'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  total: number
  client_name: string
  project_name: string | null
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export default function InvoicesPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    project_id: '',
    issue_date: '',
    due_date: '',
    notes: '',
  })
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unit_price: 0 })
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!weberUser?.organization_id) return

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          id, invoice_number, status, issue_date, due_date, total,
          clients!inner(name),
          projects!inner(name)
        `)
        .eq('organization_id', weberUser.organization_id)
        .order('created_at', { ascending: false })

      setInvoices(invoicesData?.map(i => ({
        id: i.id,
        invoice_number: i.invoice_number,
        status: i.status,
        issue_date: i.issue_date,
        due_date: i.due_date,
        total: i.total,
        client_name: (i.clients as any)?.name || 'Unknown',
        project_name: (i.projects as any)?.name || null,
      })) || [])

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', weberUser.organization_id)
        .eq('is_active', true)

      setClients(clientsData || [])
      setLoading(false)
    }

    fetchData()
  }, [weberUser])

  const loadInvoiceItems = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const { data } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
    setInvoiceItems(data || [])
  }

  const handleCreateInvoice = async () => {
    if (!weberUser?.organization_id) return

    // Generate invoice number
    const { data: countData } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('organization_id', weberUser.organization_id)
    
    const invoiceNumber = `INV-${String((countData?.count || 0) + 1).padStart(5, '0')}`

    const { data: invoiceData, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: newInvoice.client_id,
        project_id: newInvoice.project_id || null,
        issue_date: newInvoice.issue_date,
        due_date: newInvoice.due_date,
        notes: newInvoice.notes || null,
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        total: 0,
        organization_id: weberUser.organization_id,
        created_by: weberUser.id,
      })
      .select()
      .single()

    if (!error && invoiceData) {
      // Calculate and insert items
      const subtotal = parseFloat(newItem.quantity.toString()) * parseFloat(newItem.unit_price.toString())
      await supabase.from('invoice_items').insert({
        invoice_id: invoiceData.id,
        description: newItem.description,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        amount: subtotal,
      })

      // Update invoice total
      await supabase
        .from('invoices')
        .update({ subtotal, total: subtotal })
        .eq('id', invoiceData.id)

      setShowCreateModal(false)
      setNewInvoice({ client_id: '', project_id: '', issue_date: '', due_date: '', notes: '' })
      setNewItem({ description: '', quantity: 1, unit_price: 0 })
      window.location.reload()
    }
  }

  const fetchClientProjects = async (clientId: string) => {
    setNewInvoice({ ...newInvoice, client_id: clientId })
    if (!weberUser?.organization_id) return

    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', weberUser.organization_id)
      .eq('client_id', clientId)

    setProjects(data || [])
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Invoices</h1>
          <p className="text-[#757575] mt-1">Manage billing and payments</p>
        </div>
        {(weberUser?.role === 'admin' || weberUser?.role === 'team_member') && (
          <Button onClick={() => setShowCreateModal(true)}>+ New Invoice</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#1976D2] bg-opacity-20 flex items-center justify-center text-xl">💰</div>
          <div>
            <p className="text-sm text-[#757575]">Outstanding</p>
            <p className="text-2xl font-bold text-[#212121]">${totalOutstanding.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#4CAF50] bg-opacity-20 flex items-center justify-center text-xl">✓</div>
          <div>
            <p className="text-sm text-[#757575]">Paid</p>
            <p className="text-2xl font-bold text-[#212121]">
              ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FF9800] bg-opacity-20 flex items-center justify-center text-xl">📋</div>
          <div>
            <p className="text-sm text-[#757575]">Draft</p>
            <p className="text-2xl font-bold text-[#212121]">
              {invoices.filter(i => i.status === 'draft').length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#F44336] bg-opacity-20 flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p className="text-sm text-[#757575]">Overdue</p>
            <p className="text-2xl font-bold text-[#212121]">
              {invoices.filter(i => i.status === 'overdue').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#757575] mb-4">No invoices yet</p>
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>Create Your First Invoice</Button>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <tr>
                <th className="text-left p-4 font-medium text-[#757575]">Invoice #</th>
                <th className="text-left p-4 font-medium text-[#757575]">Client</th>
                <th className="text-left p-4 font-medium text-[#757575]">Project</th>
                <th className="text-left p-4 font-medium text-[#757575]">Issue Date</th>
                <th className="text-left p-4 font-medium text-[#757575]">Due Date</th>
                <th className="text-left p-4 font-medium text-[#757575]">Amount</th>
                <th className="text-left p-4 font-medium text-[#757575]">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr 
                  key={invoice.id} 
                  className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer"
                  onClick={() => loadInvoiceItems(invoice)}
                >
                  <td className="p-4 font-medium text-[#1976D2]">{invoice.invoice_number}</td>
                  <td className="p-4 text-[#212121]">{invoice.client_name}</td>
                  <td className="p-4 text-[#757575]">{invoice.project_name || '-'}</td>
                  <td className="p-4 text-[#757575]">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                  <td className="p-4 text-[#757575]">{new Date(invoice.due_date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-[#212121]">${invoice.total.toLocaleString()}</td>
                  <td className="p-4">
                    <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invoice Detail Modal */}
      <Modal 
        isOpen={!!selectedInvoice} 
        onClose={() => { setSelectedInvoice(null); setInvoiceItems([]); }}
        title={selectedInvoice?.invoice_number || 'Invoice Details'}
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E0E0E0]">
              <div>
                <p className="text-sm text-[#757575]">Client</p>
                <p className="font-medium">{selectedInvoice.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Status</p>
                <Badge variant={getStatusVariant(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Issue Date</p>
                <p>{new Date(selectedInvoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">Due Date</p>
                <p>{new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <p className="text-sm font-medium text-[#757575] mb-2">Line Items</p>
              <Card padding="sm" className="space-y-2">
                {invoiceItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span>${item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </Card>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-[#E0E0E0] pt-4">
              <span>Total</span>
              <span>${selectedInvoice.total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Invoice Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Invoice">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Client</label>
            <select
              value={newInvoice.client_id}
              onChange={(e) => fetchClientProjects(e.target.value)}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Project (Optional)</label>
            <select
              value={newInvoice.project_id}
              onChange={e => setNewInvoice({ ...newInvoice, project_id: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={newInvoice.issue_date}
              onChange={v => setNewInvoice({ ...newInvoice, issue_date: v })}
            />
            <Input
              label="Due Date"
              type="date"
              value={newInvoice.due_date}
              onChange={v => setNewInvoice({ ...newInvoice, due_date: v })}
            />
          </div>

          <div className="border-t border-[#E0E0E0] pt-4">
            <p className="text-sm font-medium text-[#757575] mb-2">Line Item</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Description"
                value={newItem.description}
                onChange={v => setNewItem({ ...newItem, description: v })}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={v => setNewItem({ ...newItem, quantity: parseFloat(v) || 0 })}
              />
              <Input
                type="number"
                placeholder="Price"
                value={newItem.unit_price}
                onChange={v => setNewItem({ ...newItem, unit_price: parseFloat(v) || 0 })}
              />
            </div>
          </div>

          <Input
            label="Notes"
            value={newInvoice.notes}
            onChange={v => setNewInvoice({ ...newInvoice, notes: v })}
            placeholder="Additional notes"
          />

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateInvoice}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    draft: 'default',
    sent: 'info',
    paid: 'success',
    overdue: 'error',
    cancelled: 'default',
  }
  return map[status] || 'default'
}