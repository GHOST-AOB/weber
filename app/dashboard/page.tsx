'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Avatar, Spinner } from '@/app/components/ui'

interface Stats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  completedTasks: number
  pendingRequests: number
  unpaidInvoices: number
}

interface RecentProject {
  id: string
  name: string
  status: string
  progress: number
  client_name: string
  updated_at: string
}

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  project_name: string
}

export default function DashboardPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingRequests: 0,
    unpaidInvoices: 0,
  })
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [myTasks, setMyTasks] = useState<TaskItem[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      if (!weberUser) return

      const orgId = weberUser.organization_id
      const userId = weberUser.id

      // Fetch stats in parallel
      const [projectsRes, tasksRes, requestsRes, invoicesRes] = await Promise.all([
        supabase.from('projects').select('id, status').eq('organization_id', orgId),
        supabase.from('tasks').select('id, status').eq('assignee_id', userId),
        supabase.from('customer_requests').select('id, status').eq('assigned_to', userId).in('status', ['new', 'assigned']),
        supabase.from('invoices').select('id, status').eq('organization_id', orgId).in('status', ['draft', 'sent']),
      ])

      setStats({
        totalProjects: projectsRes.data?.length || 0,
        activeProjects: projectsRes.data?.filter(p => p.status === 'active').length || 0,
        totalTasks: tasksRes.data?.length || 0,
        completedTasks: tasksRes.data?.filter(t => t.status === 'completed').length || 0,
        pendingRequests: requestsRes.data?.length || 0,
        unpaidInvoices: invoicesRes.data?.length || 0,
      })

      // Fetch recent projects
      const recentRes = await supabase
        .from('projects')
        .select('id, name, status, progress, updated_at, clients!inner(name)')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(5)
      
      setRecentProjects(recentRes.data?.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress,
        client_name: (p.clients as any)?.name || 'Unknown',
        updated_at: p.updated_at,
      })) || [])

      // Fetch my tasks
      const tasksDataRes = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, projects!inner(name)')
        .eq('assignee_id', userId)
        .in('status', ['todo', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5)

      setMyTasks(tasksDataRes.data?.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_name: (t.projects as any)?.name || 'Unknown',
      })) || [])

      setLoading(false)
    }

    fetchDashboardData()
  }, [weberUser])

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#212121]">
          Welcome back, {weberUser?.full_name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-[#757575] mt-1">Here's what's happening with your projects</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon="📁"
          color="#1976D2"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon="🚀"
          color="#4CAF50"
        />
        <StatCard
          title="My Tasks"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
          subtitle="completed"
          icon="✓"
          color="#FF9800"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon="🎫"
          color="#9C27B0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <h2 className="text-lg font-semibold text-[#212121] mb-4">Recent Projects</h2>
          {recentProjects.length === 0 ? (
            <p className="text-[#757575]">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#212121] truncate">{project.name}</p>
                    <p className="text-sm text-[#757575]">{project.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-[#757575]">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Tasks */}
        <Card>
          <h2 className="text-lg font-semibold text-[#212121] mb-4">My Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-[#757575]">No pending tasks</p>
          ) : (
            <div className="space-y-3">
              {myTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#212121] truncate">{task.title}</p>
                    <p className="text-sm text-[#757575]">{task.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.due_date && (
                      <span className="text-xs text-[#757575]">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <Badge variant={getPriorityVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: string
  color: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-[#757575]">{title}</p>
        <p className="text-2xl font-bold text-[#212121]">{value}</p>
        {subtitle && <p className="text-xs text-[#757575]">{subtitle}</p>}
      </div>
    </Card>
  )
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success',
    planning: 'info',
    on_hold: 'warning',
    completed: 'default',
    archived: 'default',
  }
  return variants[status] || 'default'
}

function getPriorityVariant(priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'default',
  }
  return variants[priority] || 'default'
}