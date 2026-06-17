-- SQL Schema S.A.V.O.R.I untuk Eksekusi di Supabase SQL Editor
-- Jalankan kode ini di: https://supabase.com/dashboard/project/_/sql

-- 1. Buat extension uuid-ossp jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabel Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255),
    transaction_date DATE,
    branch VARCHAR(100), -- atau branch_id jika menggunakan tabel terpisah
    type VARCHAR(50) DEFAULT 'Pengeluaran', -- Pemasukan / Pengeluaran
    category VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending / Verified
    source VARCHAR(50), -- Camera / Upload / Manual / Pesan Suara
    payment_method VARCHAR(50) DEFAULT 'Cash', -- Cash / QRIS / DANA / dll
    receipt_image_url TEXT,
    notes TEXT,
    average_confidence NUMERIC(3, 2), -- 0.00 to 1.00
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing untuk mempercepat query filtering dan pagination
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- 3. Tabel Transaction Items
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    qty NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    confidence NUMERIC(3, 2), -- 0.00 to 1.00 (khusus hasil AI)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transaction_items_trx_id ON transaction_items(transaction_id);

-- 4. Tabel Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_action ON audit_logs(table_name, action);

-- 5. Trigger untuk auto-update kolom updated_at di tabel transactions
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 6. Setup Row Level Security (RLS) untuk Keamanan Akses
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS: User hanya boleh melihat, membuat, mengubah, dan menghapus datanya sendiri
CREATE POLICY "Users can manage their own transactions" 
ON transactions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transaction items" 
ON transaction_items FOR ALL USING (
    transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own audit logs" 
ON audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
