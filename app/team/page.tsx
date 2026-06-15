'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner, Avatar } from '@/app/components/ui'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

export default function TeamPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newMember, setNewMember] = useState({
    email: '',
    full_name: '',
    role: 'team_member',
    phone: '',
  })
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    async function fetchTeam() {
      if (!weberUser?.organization_id) return

      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, phone, role, is_active, last_login, created_at')
        .eq('organization_id', weberUser.organization_id)
        .order('created_at', { ascending: false })

      setMembers(data || [])
      setLoading(false)
    }

    fetchTeam()
  }, [weberUser])

  const handleInviteMember = async () => {
    if (!weberUser?.organization_id) return
    setInviteLoading(true)

    // Create invite record and send email (simplified)
    const { error } = await supabase.from('users').insert({
      email: newMember.email,
      full_name: newMember.full_name || null,
      phone: newMember.phone || null,
      role: newMember.role as 'admin' | 'team_member' | 'client',
      is_active: false, // Will be activated via email link
      organization_id: weberUser.organization_id,
    })

    if (!error) {
      // In production, send invitation email here
      console.log('Invitation sent to:', newMember.email)
      setShowInviteModal(false)
      setNewMember({ email: '', full_name: '', role: 'team_member', phone: '' })
      window.location.reload()
    }

    setInviteLoading(false)
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId)
    setMembers(members.map(m => m.id === userId ? { ...m, is_active: !currentStatus } : m))
  }

  if (weberUser?.role !== 'admin' && weberUser?.role !== 'team_member') {
    return (
      <div className="p-8">
        <Card className="text-center py-12">
          <p className="text-[#757575]">Access denied. Team management requires admin or team member role.</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  const adminCount = members.filter(m => m.role === 'admin').length
  const teamCount = members.filter(m => m.role === 'team_member').length
  const activeCount = members.filter(m => m.is_active).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Team</h1>
          <p className="text-[#757575] mt-1">Manage your team members</p>
        </div>
        {weberUser?.role === 'admin' && (
          <Button onClick={() => setShowInviteModal(true)}>+ Invite Member</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#1976D2] bg-opacity-20 flex items-center justify-center text-xl">👥</div>
          <div>
            <p className="text-sm text-[#757575]">Total Members</p>
            <p className="text-2xl font-bold text-[#212121]">{members.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#4CAF50] bg-opacity-20 flex items-center justify-center text-xl">✓</div>
          <div>
            <p className="text-sm text-[#757575]">Active</p>
            <p className="text-2xl font-bold text-[#212121]">{activeCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FF9800] bg-opacity-20 flex items-center justify-center text-xl">⚡</div>
          <div>
            <p className="text-sm text-[#757575]">Admins / Team</p>
            <p className="text-2xl font-bold text-[#212121]">{adminCount} / {teamCount}</p>
          </div>
        </Card>
      </div>

      {/* Team List */}
      {members.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#757575] mb-4">No team members yet</p>
          <Button variant="outline" onClick={() => setShowInviteModal(true)}>Invite First Member</Button>
        </Card>
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <tr>
                <th className="text-left p-4 font-medium text-[#757575]">Member</th>
                <th className="text-left p-4 font-medium text-[#757575]">Role</th>
                <th className="text-left p-4 font-medium text-[#757575]">Status</th>
                <th className="text-left p-4 font-medium text-[#757575]">Last Login</th>
                <th className="text-left p-4 font-medium text-[#757575]">Joined</th>
                {weberUser?.role === 'admin' && (
                  <th className="text-left p-4 font-medium text-[#757575]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.full_name || member.email} size="md" />
                      <div>
                        <p className="font-medium text-[#212121]">{member.full_name || 'Unknown'}</p>
                        <p className="text-sm text-[#757575]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getRoleVariant(member.role)}>{member.role.replace('_', ' ')}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={member.is_active ? 'success' : 'default'}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-4 text-[#757575] text-sm">
                    {member.last_login 
                      ? new Date(member.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="p-4 text-[#757575] text-sm">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  {weberUser?.role === 'admin' && (
                    <td className="p-4">
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => toggleUserStatus(member.id, member.is_active)}
                          className="text-sm text-[#1976D2] hover:underline"
                        >
                          {member.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={newMember.email}
            onChange={v => setNewMember({ ...newMember, email: v })}
            placeholder="member@example.com"
          />
          <Input
            label="Full Name"
            value={newMember.full_name}
            onChange={v => setNewMember({ ...newMember, full_name: v })}
            placeholder="John Smith"
          />
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Role</label>
            <select
              value={newMember.role}
              onChange={e => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="team_member">Team Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Input
            label="Phone"
            value={newMember.phone}
            onChange={v => setNewMember({ ...newMember, phone: v })}
            placeholder="+1 (555) 000-0000"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleInviteMember} disabled={inviteLoading}>
              {inviteLoading ? <Spinner size="sm" /> : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function getRoleVariant(role: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    admin: 'error',
    team_member: 'info',
    client: 'default',
  }
  return map[role] || 'default'
}