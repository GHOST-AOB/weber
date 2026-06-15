-- Weber Management System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1976D2',
    address TEXT,
    website VARCHAR(255),
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    client_id UUID,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(50),
    title VARCHAR(100),
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    industry VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    position VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    settings JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(8, 2),
    actual_hours DECIMAL(8, 2),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Requests table
CREATE TABLE customer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('support', 'feature', 'bug', 'general')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    terms TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    request_id UUID REFERENCES customer_requests(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_contacts_client ON contacts(client_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_customer_requests_organization ON customer_requests(organization_id);
CREATE INDEX idx_customer_requests_client ON customer_requests(client_id);
CREATE INDEX idx_customer_requests_assigned_to ON customer_requests(assigned_to);
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_request ON comments(request_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view their own organization
CREATE POLICY "view_own_organization" ON organizations
    FOR SELECT USING (
        id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- Users: Admins can manage all, users can view team
CREATE POLICY "users_view_team" ON users
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND role IN ('admin', 'team_member')
    );

CREATE POLICY "users_update_self" ON users
    FOR UPDATE USING (id = auth.uid());

-- Profiles: Users can view own, admins can view all
CREATE POLICY "profiles_view_own" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_view_team" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Clients: Team can view all, clients view own
CREATE POLICY "clients_view_team" ON clients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "clients_view_own" ON clients
    FOR SELECT USING (
        id IN (SELECT id FROM clients WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
    );

CREATE POLICY "clients_manage_team" ON clients
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

-- Projects: Team can view all, clients view assigned
CREATE POLICY "projects_view_team" ON projects
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "projects_manage_team" ON projects
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "projects_view_assigned" ON projects
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    );

-- Tasks: Team can view all, clients view assigned
CREATE POLICY "tasks_view_team" ON tasks
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "tasks_manage_team" ON tasks
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "tasks_view_assigned" ON tasks
    FOR SELECT USING (assignee_id = auth.uid());

-- Customer Requests: Team view all, clients view own
CREATE POLICY "requests_view_team" ON customer_requests
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "requests_manage_team" ON customer_requests
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "requests_view_own" ON customer_requests
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
    );

CREATE POLICY "requests_create_client" ON customer_requests
    FOR INSERT WITH CHECK (
        client_id IN (SELECT id FROM clients WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'client')
    );

-- Invoices: Team can manage, clients view own
CREATE POLICY "invoices_view_team" ON invoices
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "invoices_manage_team" ON invoices
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

CREATE POLICY "invoices_view_own" ON invoices
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
    );

-- Comments: Authenticated users can manage their own
CREATE POLICY "comments_manage_own" ON comments
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "comments_view_team" ON comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'team_member'))
    );

-- Functions

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customer_requests_updated_at BEFORE UPDATE ON customer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate task progress trigger
CREATE OR REPLACE FUNCTION calculate_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        total_tasks := (SELECT COUNT(*) FROM tasks WHERE project_id = OLD.project_id);
    ELSE
        total_tasks := (SELECT COUNT(*) FROM tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id));
    END IF;
    
    completed_tasks := (SELECT COUNT(*) FROM tasks 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
        AND status = 'completed');
    
    IF total_tasks > 0 THEN
        UPDATE projects SET progress = (completed_tasks * 100 / total_tasks)::integer
        WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_progress
    AFTER INSERT OR UPDATE OF status ON tasks
    FOR EACH ROW EXECUTE FUNCTION calculate_project_progress();