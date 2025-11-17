-- Create deployment_status enum
DO $$ BEGIN
    CREATE TYPE deployment_status AS ENUM ('pending', 'deploying', 'deployed', 'failed', 'stopped', 'deleting', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create deployment_type enum
DO $$ BEGIN
    CREATE TYPE deployment_type AS ENUM ('postgres', 'redis', 'mongodb', 'mysql', 'nginx', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Deployment Info
    name TEXT NOT NULL,
    type deployment_type NOT NULL,

    -- Docker Image Info
    image TEXT NOT NULL,
    tag TEXT NOT NULL,

    -- Kubernetes Info
    container_name TEXT NOT NULL,
    namespace UUID NOT NULL DEFAULT gen_random_uuid(),

    -- Resource Configuration
    port INTEGER,
    node_port INTEGER UNIQUE,
    pvc_size INTEGER,

    -- External Access
    external_url TEXT,
    external_host TEXT,

    -- ArgoCD Integration
    argocd_app_name TEXT,
    argocd_url TEXT,

    -- Status & Health
    status deployment_status NOT NULL DEFAULT 'pending',
    health_status TEXT,
    last_sync_time TIMESTAMPTZ,

    -- Error Tracking
    error_message TEXT,
    error_details JSONB,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deployed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS deployments_user_id_idx ON deployments(user_id);
CREATE INDEX IF NOT EXISTS deployments_status_idx ON deployments(status);
CREATE INDEX IF NOT EXISTS deployments_type_idx ON deployments(type);
CREATE INDEX IF NOT EXISTS deployments_created_at_idx ON deployments(created_at);
CREATE INDEX IF NOT EXISTS deployments_deleted_at_idx ON deployments(deleted_at);
CREATE INDEX IF NOT EXISTS deployments_user_status_idx ON deployments(user_id, status);
CREATE INDEX IF NOT EXISTS deployments_type_status_idx ON deployments(type, status);

-- Create deployment_env_vars table
CREATE TABLE IF NOT EXISTS deployment_env_vars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,

    key TEXT NOT NULL,
    value TEXT NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT false,
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS deployment_env_vars_deployment_id_idx ON deployment_env_vars(deployment_id);
CREATE INDEX IF NOT EXISTS deployment_env_vars_key_idx ON deployment_env_vars(key);
CREATE INDEX IF NOT EXISTS deployment_env_vars_deployment_key_idx ON deployment_env_vars(deployment_id, key);

-- Update trigger for deployments.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
CREATE TRIGGER update_deployments_updated_at
    BEFORE UPDATE ON deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deployment_env_vars_updated_at ON deployment_env_vars;
CREATE TRIGGER update_deployment_env_vars_updated_at
    BEFORE UPDATE ON deployment_env_vars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
