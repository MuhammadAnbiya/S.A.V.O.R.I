'use client';

import { useState, useEffect } from 'react';
import FilterSidebar from '@/components/crud/FilterSidebar';
import TransactionTable from '@/components/crud/TransactionTable';
import BulkActions from '@/components/crud/BulkActions';
import EditModal from '@/components/crud/EditModal';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DatabasePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sidebarFilters, setSidebarFilters] = useState<any>({});

  // Fetch data on load
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions?limit=100');
      const result = await response.json();
      if (result.data) {
        // Format the data to match the UI expectations
        const formatted = result.data.map((trx: any) => ({
          ...trx,
          date: trx.transaction_date,
          vendor: trx.vendor_name,
          items: trx.transaction_items?.map((ti: any) => ({
            name: ti.name || 'Item tidak diketahui',
            qty: ti.qty || 1,
            unit: ti.unit || 'pcs',
            price: ti.price || 0,
            subtotal: ti.subtotal || 0
          })) || []
        }));
        setTransactions(formatted);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleEdit = (trx: any) => {
    setSelectedTransaction(trx);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} transaksi?`)) return;
    try {
      await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'delete' })
      });
      setSelectedIds([]);
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleBulkCategorize = async () => {
    const category = prompt('Masukkan nama kategori untuk transaksi terpilih:');
    if (!category) return;
    try {
      await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action: 'categorize', data: { category } })
      });
      setSelectedIds([]);
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredTransactions = transactions.filter(trx => {
    let pass = true;
    if (sidebarFilters.vendor) {
      if (!trx.vendor?.toLowerCase().includes(sidebarFilters.vendor.toLowerCase())) pass = false;
    }
    if (sidebarFilters.category && sidebarFilters.category.length > 0) {
      if (!sidebarFilters.category.includes(trx.category)) pass = false;
    }
    if (sidebarFilters.branch) {
      if (!trx.branch?.toLowerCase().includes(sidebarFilters.branch.toLowerCase())) pass = false;
    }
    if (sidebarFilters.startDate) {
      const trxDate = new Date(trx.date || 0).setHours(0,0,0,0);
      const startDate = new Date(sidebarFilters.startDate).setHours(0,0,0,0);
      if (trxDate < startDate) pass = false;
    }
    if (sidebarFilters.endDate) {
      const trxDate = new Date(trx.date || 0).setHours(0,0,0,0);
      const endDate = new Date(sidebarFilters.endDate).setHours(0,0,0,0);
      if (trxDate > endDate) pass = false;
    }
    if (sidebarFilters.sources && sidebarFilters.sources.length > 0) {
      const trxSource = (trx.source || '').toLowerCase();
      if (!sidebarFilters.sources.some((s: string) => trxSource.includes(s.toLowerCase()))) pass = false;
    }
    return pass;
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    
    const headers = ['No. Ref', 'Tanggal', 'Vendor', 'Kategori', 'Total (Rp)', 'Sumber', 'Cabang', 'Status', 'Catatan', 'Detail Item'];
    
    const rows = filteredTransactions.map(trx => {
      const itemsString = trx.items?.map((i:any) => `${i.name} (${i.qty}x)`).join('; ') || '';
      return [
        trx.id,
        trx.date,
        `"${trx.vendor || ''}"`,
        trx.category || '',
        trx.amount,
        trx.source || '',
        trx.branch || '',
        trx.status || '',
        `"${(trx.notes || '').replace(/"/g, '""')}"`,
        `"${itemsString}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `savori_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueBranches = Array.from(new Set(transactions.map(t => t.branch).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Database Transaksi</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manajemen dan pantau semua data transaksi pengeluaran dan pemasukan.
          </p>
        </div>
        <Button variant="outline" className="bg-white" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-auto lg:h-[calc(100vh-180px)]">
        {/* Kolom 1: Filter Sidebar (Lebar tetap) */}
        <div className="w-full lg:w-72 flex-shrink-0 h-auto lg:h-full lg:overflow-y-auto mb-4 lg:mb-0">
          <FilterSidebar 
            onApply={setSidebarFilters} 
            onReset={() => setSidebarFilters({})} 
            branches={uniqueBranches}
          />
        </div>

        {/* Kolom 2: Transaction Table (Mengisi sisa ruang) */}
        <div className="flex-1 w-full min-h-[500px] lg:h-full min-w-0">
          <TransactionTable 
            transactions={filteredTransactions} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelectionChange={setSelectedIds}
          />
        </div>
        
        {/* Kolom 3: (Optional) Talk to Data / Chatbot placeholder */}
        {/* <div className="w-80 flex-shrink-0 h-full hidden xl:block"> */}
        {/*   <ChatbotPanel /> */}
        {/* </div> */}
      </div>

      {/* Bulk Actions Floating Bar */}
      <BulkActions 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])}
        onDelete={handleBulkDelete}
        onCategorize={handleBulkCategorize}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditModal 
          transaction={selectedTransaction} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
