'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, Modal, Input, Spinner } from '@/app/components/ui'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  budget: number | null
  progress: number
  client_name: string
}

export default function ProjectsPage() {
  const { weberUser } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    client_id: '',
    start_date: '',
    end_date: '',
    budget: '',
  })

  useEffect(() => {
    async function fetchProjects() {
      if (!weberUser?.organization_id) return

      const { data } = await supabase
        .from('projects')
        .select(`
          id, name, description, status, start_date, end_date, budget, progress,
          clients!inner(name)
        `)
        .eq('organization_id', weberUser.organization_id)
        .order('created_at', { ascending: false })

      setProjects(data?.map(p => ({
        ...p,
        client_name: (p.clients as any)?.name || 'Unknown',
      })) || [])
      setLoading(false)
    }

    fetchProjects()
  }, [weberUser])

  const handleCreateProject = async () => {
    if (!weberUser?.organization_id) return

    const { error } = await supabase.from('projects').insert({
      name: newProject.name,
      description: newProject.description || null,
      client_id: newProject.client_id || null,
      start_date: newProject.start_date || null,
      end_date: newProject.end_date || null,
      budget: newProject.budget ? parseFloat(newProject.budget) : null,
      status: 'planning',
      progress: 0,
      organization_id: weberUser.organization_id,
      created_by: weberUser.id,
    })

    if (!error) {
      setShowCreateModal(false)
      setNewProject({ name: '', description: '', client_id: '', start_date: '', end_date: '', budget: '' })
      // Refresh projects
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
          <h1 className="text-2xl font-bold text-[#212121]">Projects</h1>
          <p className="text-[#757575] mt-1">Manage your client projects</p>
        </div>
        {(weberUser?.role === 'admin' || weberUser?.role === 'team_member') && (
          <Button onClick={() => setShowCreateModal(true)}>
            + New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#757575] mb-4">No projects yet</p>
          <Button variant="outline" onClick={() => setShowCreateModal(true)}>
            Create Your First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            value={newProject.name}
            onChange={v => setNewProject({ ...newProject, name: v })}
            placeholder="Enter project name"
          />
          <div>
            <label className="block text-sm font-medium text-[#757575] mb-1">Description</label>
            <textarea
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              placeholder="Project description"
              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1976D2] resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={newProject.start_date}
              onChange={v => setNewProject({ ...newProject, start_date: v })}
            />
            <Input
              label="End Date"
              type="date"
              value={newProject.end_date}
              onChange={v => setNewProject({ ...newProject, end_date: v })}
            />
          </div>
          <Input
            label="Budget"
            type="number"
            value={newProject.budget}
            onChange={v => setNewProject({ ...newProject, budget: v })}
            placeholder="0.00"
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    planning: 'info',
    active: 'success',
    on_hold: 'warning',
    completed: 'default',
    archived: 'default',
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-[#212121] truncate pr-4">{project.name}</h3>
        <Badge variant={statusColors[project.status]}>{project.status.replace('_', ' ')}</Badge>
      </div>
      
      <p className="text-sm text-[#757575] mb-4 line-clamp-2">
        {project.description || 'No description'}
      </p>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-[#757575]">Client</span>
          <span className="text-[#212121]">{project.client_name}</span>
        </div>
        {project.budget && (
          <div className="flex justify-between">
            <span className="text-[#757575]">Budget</span>
            <span className="text-[#212121]">${project.budget.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#757575]">Progress</span>
          <span className="text-[#212121]">{project.progress}%</span>
        </div>
        <div className="h-2 bg-[#E0E0E0] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1976D2] rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#9E9E9E]">
        {project.start_date && (
          <span>{new Date(project.start_date).toLocaleDateString()}</span>
        )}
        {project.end_date && (
          <span>→ {new Date(project.end_date).toLocaleDateString()}</span>
        )}
      </div>
    </Card>
  )
}