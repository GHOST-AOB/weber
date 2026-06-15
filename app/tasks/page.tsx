'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner, Avatar } from '@/app/components/ui'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  project_name: string
  project_id: string
  assignee_name: string | null
  assignee_avatar: string | null
}

export default function TasksPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    priority: 'medium',
    due_date: '',
    assignee_id: '',
  })
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!weberUser?.organization_id) return

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, due_date,
          projects!inner(name),
          assignee:users!left(full_name, avatar_url)
        `)
        .eq('organization_id', weberUser.organization_id)
        .order('created_at', { ascending: false })

      setTasks(tasksData?.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_name: (t.projects as any)?.name,
        project_id: (t.projects as any)?.id,
        assignee_name: (t.assignee as any)?.[0]?.full_name || null,
        assignee_avatar: (t.assignee as any)?.[0]?.avatar_url || null,
      })) || [])

      // Fetch projects for select
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', weberUser.organization_id)

      setProjects(projectsData || [])

      // Fetch team members
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('organization_id', weberUser.organization_id)
        .eq('is_active', true)

      setUsers(usersData || [])
      setLoading(false)
    }

    fetchData()
  }, [weberUser])

  const handleCreateTask = async () => {
    if (!weberUser?.organization_id) return

    const { error } = await supabase.from('tasks').insert({
      title: newTask.title,
      description: newTask.description || null,
      project_id: newTask.project_id,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      assignee_id: newTask.assignee_id || null,
      status: 'todo',
      organization_id: weberUser.organization_id,
      created_by: weberUser.id,
    })

    if (!error) {
      setShowCreateModal(false)
      setNewTask({ title: '', description: '', project_id: '', priority: 'medium', due_date: '', assignee_id: '' })
      window.location.reload()
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
  }

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const reviewTasks = tasks.filter(t => t.status === 'review')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#212121]">Tasks</h1>
          <p className="text-[#757575] mt-1">Manage your project tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-[#E0E0E0] overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-[#1976D2] text-white' : 'bg-white text-[#757575]'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-2 text-sm ${viewMode === 'board' ? 'bg-[#1976D2] text-white' : 'bg-white text-[#757575]'}`}
            >
              Board
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ New Task</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0]">
              <tr>
                <th className="text-left p-4 font-medium text-[#757575]">Task</th>
                <th className="text-left p-4 font-medium text-[#757575]">Project</th>
                <th className="text-left p-4 font-medium text-[#757575]">Assignee</th>
                <th className="text-left p-4 font-medium text-[#757575]">Priority</th>
                <th className="text-left p-4 font-medium text-[#757575]">Due Date</th>
                <th className="text-left p-4 font-medium text-[#757575]">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                  <td className="p-4">
                    <p className="font-medium text-[#212121]">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-[#757575] truncate max-w-xs">{task.description}</p>
                    )}
                  </td>
                  <td className="p-4 text-[#757575]">{task.project_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee_name || 'Unassigned'} size="sm" />
                      <span className="text-sm text-[#757575]">{task.assignee_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                  </td>
                  <td className="p-4 text-[#757575] text-sm">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-4">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          <TaskColumn title="To Do" tasks={todoTasks} color="#1976D2" onStatusChange={updateTaskStatus} />
          <TaskColumn title="In Progress" tasks={inProgressTasks} color="#FF9800" onStatusChange={updateTaskStatus} />
          <TaskColumn title="Review" tasks={reviewTasks} color="#9C27B0" onStatusChange={updateTaskStatus} />
          <TaskColumn title="Completed" tasks={completedTasks} color="#4CAF50" onStatusChange={updateTaskStatus} />
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Task">
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={newTask.title}
            onChange={v => setNewTask({ ...newTask, title: v })}
            placeholder="Enter task title"
          />
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Description</label>
            <textarea
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Task description"
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Project</label>
            <select
              value={newTask.project_id}
              onChange={e => setNewTask({ ...newTask, project_id: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="">Select project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#757575] mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              value={newTask.due_date}
              onChange={v => setNewTask({ ...newTask, due_date: v })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Assignee</label>
            <select
              value={newTask.assignee_id}
              onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })}
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateTask}>Create Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TaskColumn({ 
  title, 
  tasks, 
  color, 
  onStatusChange 
}: { 
  title: string
  tasks: Task[]
  color: string
  onStatusChange: (id: string, status: string) => void
}) {
  const statusMap: Record<string, string> = {
    'To Do': 'todo',
    'In Progress': 'in_progress',
    'Review': 'review',
    'Completed': 'completed',
  }

  return (
    <div className="bg-[#FAFAFA] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-medium text-[#212121]">{title}</h3>
        <span className="text-sm text-[#757575]">({tasks.length})</span>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <Card key={task.id} padding="sm" className="cursor-pointer hover:shadow-md transition-shadow">
            <p className="font-medium text-[#212121] mb-2">{task.title}</p>
            <div className="flex items-center justify-between text-xs text-[#757575]">
              <span>{task.project_name}</span>
              <Badge variant={getPriorityVariant(task.priority)} className="text-xs">{task.priority}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
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