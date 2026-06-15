'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Input, Spinner, Avatar } from '@/app/components/ui'

export default function SettingsPage() {
  const { weberUser, user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    timezone: 'UTC',
    notification_email: true,
    notification_push: true,
  })
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  useEffect(() => {
    async function fetchProfile() {
      if (!weberUser) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', weberUser.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.first_name + ' ' + data.last_name,
          phone: data.phone || '',
          timezone: data.timezone || 'UTC',
          notification_email: data.notification_preferences?.email ?? true,
          notification_push: data.notification_preferences?.push ?? true,
        })
      }
      setLoading(false)
    }

    fetchProfile()
  }, [weberUser])

  const handleSaveProfile = async () => {
    if (!weberUser) return
    setSaving(true)

    const [firstName, ...lastNameParts] = profile.full_name.split(' ')
    const lastName = lastNameParts.join(' ')

    await supabase.from('profiles').upsert({
      user_id: weberUser.id,
      first_name: firstName,
      last_name: lastName,
      phone: profile.phone || null,
      timezone: profile.timezone,
      notification_preferences: {
        email: profile.notification_email,
        push: profile.notification_push,
      },
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      alert('Passwords do not match')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password.new,
    })

    if (!error) {
      setPassword({ current: '', new: '', confirm: '' })
      alert('Password updated successfully')
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-[#212121] mb-8">Settings</h1>

      {/* Profile Section */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-[#212121] mb-6">Profile</h2>
        
        <div className="flex items-center gap-6 mb-6">
          <Avatar name={profile.full_name || 'User'} size="lg" />
          <div>
            <p className="font-medium text-[#212121]">{profile.full_name || 'User'}</p>
            <p className="text-sm text-[#757575]">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            value={profile.full_name}
            onChange={v => setProfile({ ...profile, full_name: v })}
          />
          <Input
            label="Phone"
            value={profile.phone}
            onChange={v => setProfile({ ...profile, phone: v })}
          />
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Timezone</label>
            <select
              value={profile.timezone}
              onChange={e => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </Button>
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-[#212121] mb-6">Notifications</h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.notification_email}
              onChange={e => setProfile({ ...profile, notification_email: e.target.checked })}
              className="w-5 h-5 rounded border-[#E0E0E0] text-[#1976D2] focus:ring-[#1976D2]"
            />
            <span className="text-[#212121]">Email notifications</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.notification_push}
              onChange={e => setProfile({ ...profile, notification_push: e.target.checked })}
              className="w-5 h-5 rounded border-[#E0E0E0] text-[#1976D2] focus:ring-[#1976D2]"
            />
            <span className="text-[#212121]">Push notifications</span>
          </label>
        </div>
      </Card>

      {/* Password Section */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-[#212121] mb-6">Change Password</h2>
        
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password.new}
            onChange={v => setPassword({ ...password, new: v })}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={password.confirm}
            onChange={v => setPassword({ ...password, confirm: v })}
          />
          <Button onClick={handleChangePassword}>Update Password</Button>
        </div>
      </Card>

      {/* Role Info */}
      <Card>
        <h2 className="text-lg font-semibold text-[#212121] mb-4">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#757575]">Role</span>
            <span className="font-medium capitalize">{weberUser?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#757575]">Email</span>
            <span>{user?.email}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}