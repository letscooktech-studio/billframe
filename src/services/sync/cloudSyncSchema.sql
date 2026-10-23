-- ============================================================================
-- BILLFRAME UNIVERSAL CLOUD SYNC SCHEMA (SUPABASE POSTGRESQL)
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE CLOUD SYNC TABLES (JSONB RESILIENT DELTA ARCHITECTURE)

-- Table: cloud_business_profiles
CREATE TABLE IF NOT EXISTS public.cloud_business_profiles (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_customers
CREATE TABLE IF NOT EXISTS public.cloud_customers (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_catalog_items
CREATE TABLE IF NOT EXISTS public.cloud_catalog_items (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_documents (Invoices, Estimates, Credit Notes, Slips)
CREATE TABLE IF NOT EXISTS public.cloud_documents (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_document_items
CREATE TABLE IF NOT EXISTS public.cloud_document_items (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id TEXT NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_payments
CREATE TABLE IF NOT EXISTS public.cloud_payments (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- Table: cloud_universal_documents (446-catalogue studio contracts, slips, offers)
CREATE TABLE IF NOT EXISTS public.cloud_universal_documents (
    id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    data JSONB NOT NULL,
    client_updated_at BIGINT NOT NULL,
    server_updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    device_id TEXT,
    PRIMARY KEY (user_id, id)
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL SYNC TABLES
ALTER TABLE public.cloud_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_universal_documents ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Users can only read, insert, update, or delete their OWN data)

-- Profiles
CREATE POLICY "Users can manage own business profiles"
ON public.cloud_business_profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Customers
CREATE POLICY "Users can manage own customers"
ON public.cloud_customers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Catalog Items
CREATE POLICY "Users can manage own catalog items"
ON public.cloud_catalog_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can manage own documents"
ON public.cloud_documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Document Items
CREATE POLICY "Users can manage own document items"
ON public.cloud_document_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can manage own payments"
ON public.cloud_payments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Universal Documents
CREATE POLICY "Users can manage own universal documents"
ON public.cloud_universal_documents
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. PERFORMANCE INDEXES FOR LIGHTNING-FAST DELTA SYNC
CREATE INDEX IF NOT EXISTS idx_cloud_documents_delta ON public.cloud_documents (user_id, server_updated_at);
CREATE INDEX IF NOT EXISTS idx_cloud_customers_delta ON public.cloud_customers (user_id, server_updated_at);
CREATE INDEX IF NOT EXISTS idx_cloud_items_delta ON public.cloud_catalog_items (user_id, server_updated_at);
CREATE INDEX IF NOT EXISTS idx_cloud_payments_delta ON public.cloud_payments (user_id, server_updated_at);
CREATE INDEX IF NOT EXISTS idx_cloud_doc_items_delta ON public.cloud_document_items (user_id, server_updated_at);
CREATE INDEX IF NOT EXISTS idx_cloud_univ_docs_delta ON public.cloud_universal_documents (user_id, server_updated_at);

-- 6. AUTO UPDATE TRIGGER FOR SERVER_UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.server_updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_cloud_documents_upd
BEFORE UPDATE ON public.cloud_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER tr_cloud_customers_upd
BEFORE UPDATE ON public.cloud_customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER tr_cloud_catalog_items_upd
BEFORE UPDATE ON public.cloud_catalog_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER tr_cloud_payments_upd
BEFORE UPDATE ON public.cloud_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER tr_cloud_universal_docs_upd
BEFORE UPDATE ON public.cloud_universal_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
