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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Database Transaksi</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manajemen dan pantau semua data transaksi pengeluaran dan pemasukan.
          </p>
        </div>
        <Button variant="outline" className="bg-white">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-180px)]">
        {/* Kolom 1: Filter Sidebar (Lebar tetap) */}
        <div className="w-full lg:w-72 flex-shrink-0 h-full overflow-y-auto">
          <FilterSidebar onApply={() => {}} onReset={() => {}} />
        </div>

        {/* Kolom 2: Transaction Table (Mengisi sisa ruang) */}
        <div className="flex-1 w-full h-full min-w-0">
          <TransactionTable 
            transactions={transactions} 
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
