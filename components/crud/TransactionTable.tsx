'use client';

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, Edit3, Trash2, Eye } from "lucide-react";

export default function TransactionTable({ transactions, onEdit, onDelete, onSelectionChange }: any) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Tanggal (Terbaru)');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, transactions]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newIds = new Set(prev);
      if (newIds.has(id)) newIds.delete(id);
      else newIds.add(id);
      return newIds;
    });
  };

  const processedTransactions = React.useMemo(() => {
    let result = [...transactions];
    
    // 1. Search & Auto Expand
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const newExpanded = new Set<string>();
      
      result = result.filter((t: any) => {
        const itemMatch = t.items?.some((item: any) => (item.name?.toLowerCase() || '').includes(q));
        if (itemMatch) {
          newExpanded.add(t.id);
        }
        
        return (t.vendor?.toLowerCase() || '').includes(q) || 
               (t.category?.toLowerCase() || '').includes(q) ||
               itemMatch;
      });
      
      // Auto expand rows with item matches
      setExpandedIds(newExpanded);
    }

    // 2. Sort
    result.sort((a: any, b: any) => {
      if (sortOption === 'Tanggal (Terbaru)') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOption === 'Vendor (A-Z)') {
        return (a.vendor || '').localeCompare(b.vendor || '');
      } else if (sortOption === 'Total (Tertinggi)') {
        return Number(b.amount) - Number(a.amount);
      }
      return 0;
    });

    return result;
  }, [transactions, searchQuery, sortOption]);

  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
  const paginatedTransactions = processedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set<string>(processedTransactions.map((t: any) => t.id));
      setSelectedIds(allIds);
      onSelectionChange(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  return (
    <Card className="bg-bg-card rounded-lg shadow-sm border border-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari vendor atau nama barang..." 
            className="pl-9 bg-white border-border shadow-sm rounded-full placeholder:text-gray-500 font-medium focus-visible:ring-primary focus-visible:ring-1" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <span>Sort by:</span>
          <select 
            className="border-none bg-transparent font-medium text-text-primary focus:ring-0 cursor-pointer"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option>Tanggal (Terbaru)</option>
            <option>Vendor (A-Z)</option>
            <option>Total (Tertinggi)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-text-secondary border-b sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  onChange={handleSelectAll}
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                />
              </th>
              <th className="px-4 py-3 font-medium">No. Ref</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Metode</th>
              <th className="px-4 py-3 font-medium">Sumber</th>
              <th className="px-4 py-3 font-medium text-right">Total (Rp)</th>
              <th className="px-4 py-3 font-medium text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedTransactions.map((trx: any) => (
              <React.Fragment key={trx.id}>
                <tr className={`hover:bg-main/30 transition-colors ${expandedIds.has(trx.id) ? 'bg-main/50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300" 
                      checked={selectedIds.has(trx.id)}
                      onChange={(e) => handleSelect(trx.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-primary cursor-pointer flex items-center gap-1" onClick={() => toggleExpand(trx.id)}>
                    {trx.id.substring(0, 8)}...
                    {expandedIds.has(trx.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </td>
                  <td className="px-4 py-3">{trx.date}</td>
                  <td className="px-4 py-3 font-medium">{trx.vendor}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-main text-text-secondary border whitespace-nowrap inline-block">
                      {trx.category || 'Belum Kategori'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {trx.payment_method || 'Cash'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-surface-soft text-text-secondary border border-border whitespace-nowrap inline-block">
                      {trx.source || 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {trx.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-primary" onClick={() => toggleExpand(trx.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-accent" onClick={() => onEdit(trx)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-text-secondary hover:text-danger" onClick={() => onDelete(trx.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                
                {expandedIds.has(trx.id) && (
                  <tr className="bg-main/20">
                    <td colSpan={9} className="px-10 py-4 border-b">
                      <div className="bg-white p-4 rounded border shadow-sm">
                        <h4 className="text-xs font-bold text-text-secondary uppercase mb-2 border-b pb-2">Detail Item</h4>
                        {trx.items && trx.items.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-text-secondary">
                                <th className="text-left py-1">Nama Barang</th>
                                <th className="text-center py-1">Qty</th>
                                <th className="text-right py-1">Harga Satuan</th>
                                <th className="text-right py-1">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trx.items.map((item: any, i: number) => (
                                <tr key={i} className="border-t border-border/50">
                                  <td className="py-2">{item.name}</td>
                                  <td className="py-2 text-center">{item.qty} {item.unit}</td>
                                  <td className="py-2 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                                  <td className="py-2 text-right font-medium">Rp {(item.subtotal ?? (item.qty * item.price)).toLocaleString('id-ID')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-text-secondary italic">Tidak ada rincian item.</p>
                        )}
                        
                        {trx.notes && (
                          <div className="mt-4 pt-3 border-t border-border/50">
                            <h4 className="text-xs font-bold text-text-secondary uppercase mb-1">Catatan Tambahan</h4>
                            <p className="text-sm text-ink bg-main/50 p-3 rounded">{trx.notes}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-text-secondary bg-white">
        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
          <span>Baris per halaman:</span>
          <select 
            className="border border-border rounded px-2 py-1 bg-main focus:outline-none focus:ring-1 focus:ring-primary"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <span className="text-center w-full md:w-auto">
          Menampilkan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedTransactions.length)} dari {processedTransactions.length} transaksi
        </span>
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="bg-white w-full md:w-auto"
          >
            Sebelumnya
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="bg-white w-full md:w-auto"
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </Card>
  );
}
