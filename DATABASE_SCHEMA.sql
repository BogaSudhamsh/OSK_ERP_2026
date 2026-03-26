-- OSK Granite App Database Schema
-- This schema can be used with PostgreSQL (Supabase) or adapted for Firestore

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('store', 'inventory', 'sales')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid() = id);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE customers (
    id VARCHAR(20) PRIMARY KEY, -- Format: CUST-XXX
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    store_id UUID REFERENCES users(id),
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_store_all ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'store'
            AND users.id = customers.store_id
        )
    );

CREATE POLICY customers_others_select ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('sales', 'inventory')
        )
    );

-- ============================================================================
-- DEALERS TABLE
-- ============================================================================
CREATE TABLE dealers (
    id VARCHAR(20) PRIMARY KEY, -- Format: DEAL-XXX
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    payment_terms VARCHAR(50) NOT NULL,
    total_purchases DECIMAL(15, 2) DEFAULT 0,
    outstanding_payment DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dealers_email ON dealers(email);
CREATE INDEX idx_dealers_name ON dealers(name);

-- Row Level Security
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

CREATE POLICY dealers_inventory_all ON dealers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'inventory'
        )
    );

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
    id VARCHAR(20) PRIMARY KEY, -- Format: PROD-XXX
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    dealer_id VARCHAR(20) REFERENCES dealers(id),
    dealer_name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    images JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_dealer_id ON products(dealer_id);
CREATE INDEX idx_products_enabled ON products(enabled);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_updated_at ON products(updated_at DESC);

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_all ON products
    FOR SELECT
    TO authenticated;

CREATE POLICY products_inventory_all ON products
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'inventory'
        )
    );

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
    id VARCHAR(20) PRIMARY KEY, -- Format: ORD-XXX
    customer_id VARCHAR(20) REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    store_id UUID REFERENCES users(id),
    items JSONB NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    gst DECIMAL(15, 2) NOT NULL,
    total DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_store_all ON orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'store'
            AND users.id = orders.store_id
        )
    );

CREATE POLICY orders_others_select ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('sales', 'inventory')
        )
    );

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
CREATE TABLE leads (
    id VARCHAR(20) PRIMARY KEY, -- Format: LEAD-XXX
    customer_id VARCHAR(20) REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    assigned_to UUID REFERENCES users(id),
    notes JSONB DEFAULT '[]'::jsonb,
    call_logs JSONB DEFAULT '[]'::jsonb,
    order_id VARCHAR(20) REFERENCES orders(id),
    estimated_value DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_sales_all ON leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'sales'
        )
    );

CREATE POLICY leads_others_select ON leads
    FOR SELECT
    USING (authenticated);

-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================================
CREATE TABLE stock_movements (
    id VARCHAR(20) PRIMARY KEY, -- Format: STOCK-XXX
    product_id VARCHAR(20) REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    dealer_id VARCHAR(20) REFERENCES dealers(id),
    order_id VARCHAR(20) REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_dealer_id ON stock_movements(dealer_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);

-- Row Level Security
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY stock_movements_inventory_all ON stock_movements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'inventory'
        )
    );

CREATE POLICY stock_movements_others_select ON stock_movements
    FOR SELECT
    USING (authenticated);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own ON notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOGS TABLE (Optional but Recommended)
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
    resource VARCHAR(50) NOT NULL, -- customers, products, orders, etc.
    resource_id VARCHAR(50) NOT NULL,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create lead when customer is created
CREATE OR REPLACE FUNCTION create_lead_for_customer()
RETURNS TRIGGER AS $$
DECLARE
    next_lead_id VARCHAR(20);
BEGIN
    -- Generate next lead ID
    SELECT 'LEAD-' || LPAD((COALESCE(MAX(SUBSTRING(id FROM 6)::INTEGER), 0) + 1)::TEXT, 3, '0')
    INTO next_lead_id
    FROM leads;
    
    -- Create lead
    INSERT INTO leads (
        id,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        status,
        estimated_value
    ) VALUES (
        next_lead_id,
        NEW.id,
        NEW.name,
        NEW.phone,
        NEW.email,
        NEW.address || ', ' || NEW.city || ', ' || NEW.state || ' - ' || NEW.pincode,
        'new',
        0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_lead_on_customer_insert
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_lead_for_customer();

-- Function to check and create low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= 10 AND NEW.stock > 0 AND NEW.enabled = true THEN
        -- Create notification for all inventory users
        INSERT INTO notifications (user_id, type, title, message)
        SELECT 
            id,
            'warning',
            'Low Stock Alert',
            NEW.name || ' has only ' || NEW.stock || ' units remaining'
        FROM users
        WHERE role = 'inventory';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_low_stock_on_update
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION check_low_stock();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Sales Dashboard View
CREATE VIEW sales_dashboard AS
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.customer_id) as total_customers,
    SUM(o.total) as total_revenue,
    AVG(o.total) as avg_order_value,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders
FROM orders o;

-- Inventory Dashboard View
CREATE VIEW inventory_dashboard AS
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_products,
    COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
    COUNT(CASE WHEN stock <= 10 AND stock > 0 THEN 1 END) as low_stock,
    SUM(stock * price) as total_inventory_value
FROM products;

-- Lead Pipeline View
CREATE VIEW lead_pipeline AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(estimated_value) as total_value,
    AVG(estimated_value) as avg_value
FROM leads
GROUP BY status;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'store@oskgranite.com', 'Raj Kumar', 'store'),
    ('550e8400-e29b-41d4-a716-446655440002', 'inventory@oskgranite.com', 'Priya Sharma', 'inventory'),
    ('550e8400-e29b-41d4-a716-446655440003', 'sales@oskgranite.com', 'Amit Patel', 'sales');

-- Note: Additional sample data should be inserted through the application
-- to ensure proper ID generation and trigger execution

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE customers;
ANALYZE dealers;
ANALYZE products;
ANALYZE orders;
ANALYZE leads;
ANALYZE stock_movements;
ANALYZE notifications;

-- Enable auto-vacuum for better performance
ALTER TABLE customers SET (autovacuum_enabled = true);
ALTER TABLE products SET (autovacuum_enabled = true);
ALTER TABLE orders SET (autovacuum_enabled = true);
ALTER TABLE leads SET (autovacuum_enabled = true);
ALTER TABLE stock_movements SET (autovacuum_enabled = true);
