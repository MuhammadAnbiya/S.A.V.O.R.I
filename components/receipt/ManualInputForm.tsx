'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Check } from 'lucide-react';

export default function ManualInputForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState({
    id: initialData?.id || '',
    vendor_name: initialData?.vendor_name || initialData?.vendor || '',
    transaction_date: initialData?.transaction_date || initialData?.date || '',
    type: initialData?.type || 'Pengeluaran',
    category: initialData?.category || 'Operasional',
    branch: initialData?.branch || 'Pusat',
    notes: initialData?.notes || '',
    total_amount: initialData?.total_amount || initialData?.amount || 0,
    items: initialData?.items && initialData.items.length > 0 ? initialData.items.map((item: any) => ({
      id: item.id || Date.now().toString() + Math.random(),
      name: item.name,
      quantity: item.qty || item.quantity || 1,
      unit: item.unit || 'pcs',
      unit_price: item.price || item.unit_price || 0,
      subtotal: (item.qty || item.quantity || 1) * (item.price || item.unit_price || 0)
    })) : [
      {
        id: Date.now().toString(),
        name: '',
        quantity: 1,
        unit: 'pcs',
        unit_price: 0,
        subtotal: 0
      }
    ]
  });

  const handleItemChange = (id: string, field: string, value: string | number) => {
    setData(prev => {
      const newItems = prev.items.map((item: any) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.subtotal = Number(updatedItem.quantity) * Number(updatedItem.unit_price);
          }
          return updatedItem;
        }
        return item;
      });

      const newTotal = newItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);

      return {
        ...prev,
        items: newItems,
        total_amount: newTotal
      };
    });
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString(),
          name: '',
          quantity: 1,
          unit: 'pcs',
          unit_price: 0,
          subtotal: 0
        }
      ]
    }));
  };

  const removeItem = (id: string) => {
    setData(prev => {
      const newItems = prev.items.filter((item: any) => item.id !== id);
      const newTotal = newItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
      return { ...prev, items: newItems, total_amount: newTotal };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        vendor_name: data.vendor_name,
        transaction_date: data.transaction_date,
        amount: data.total_amount,
        type: data.type,
        category: data.category,
        branch: data.branch,
        notes: data.notes,
        status: 'Verified',
        source: 'Manual',
        items: data.items.map((item: any) => ({
          name: item.name,
          qty: Number(item.quantity) || 1,
          unit: item.unit || 'pcs',
          price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0
        }))
      };

      const url = data.id ? `/api/transactions/${data.id}` : '/api/transactions';
      const method = data.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Gagal menyimpan transaksi');

      toast.success(data.id ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!');
      router.push('/dashboard/database');
      // For refreshing parent components if used inside a modal
      if (data.id) window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Jenis Transaksi</Label>
          <select 
            id="type" 
            value={data.type}
            onChange={(e) => setData({...data, type: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Pengeluaran">Pengeluaran</option>
            <option value="Pemasukan">Pemasukan</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select 
            id="category" 
            value={data.category}
            onChange={(e) => setData({...data, category: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Operasional">Operasional</option>
            <option value="Peralatan">Peralatan</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Transportasi">Transportasi</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor / Pelanggan</Label>
          <Input 
            id="vendor" 
            placeholder="Ketik nama vendor..." 
            value={data.vendor_name}
            onChange={(e) => setData({...data, vendor_name: e.target.value})}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Tanggal Transaksi</Label>
          <Input 
            id="date" 
            type="date" 
            value={data.transaction_date}
            onChange={(e) => setData({...data, transaction_date: e.target.value})}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Cabang</Label>
          <Input 
            id="branch" 
            placeholder="Contoh: Pusat, Cabang 1"
            value={data.branch}
            onChange={(e) => setData({...data, branch: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Daftar Item</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Item
          </Button>
        </div>

        <div className="space-y-3">
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 border rounded-t-md font-medium text-sm text-text-secondary">
            <div className="col-span-4">Nama Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-center">Satuan</div>
            <div className="col-span-2 text-right">Harga</div>
            <div className="col-span-2 text-right">Subtotal</div>
          </div>

          <div className="space-y-3 md:space-y-0 md:border md:rounded-b-md md:border-t-0 md:-mt-3">
            {data.items.map((item: any, index: number) => (
              <div 
                key={item.id} 
                className="relative bg-white border rounded-lg p-3 shadow-sm md:grid md:grid-cols-12 md:gap-2 md:items-center md:border-0 md:border-b md:last:border-0 md:rounded-none md:shadow-none md:p-2"
              >
                {/* Mobile Header */}
                <div className="flex justify-between items-center mb-2 md:hidden">
                  <span className="text-xs font-semibold text-text-tertiary uppercase">Item {index + 1}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-danger hover:bg-danger/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="col-span-4 mb-2 md:mb-0">
                  <Label className="text-xs text-text-secondary md:hidden mb-1 block">Nama Item</Label>
                  <Input 
                    value={item.name} 
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="h-9 md:h-8"
                    required
                    placeholder="Nama barang..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2 md:mb-0 md:col-span-4">
                  <div>
                    <Label className="text-xs text-text-secondary md:hidden mb-1 block">Qty</Label>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="h-9 md:h-8"
                      min="0.01"
                      step="any"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-text-secondary md:hidden mb-1 block">Satuan</Label>
                    <Input 
                      value={item.unit} 
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="h-9 md:h-8"
                      placeholder="pcs, kg..."
                    />
                  </div>
                </div>

                <div className="col-span-2 mb-2 md:mb-0">
                  <Label className="text-xs text-text-secondary md:hidden mb-1 block">Harga Satuan</Label>
                  <Input 
                    type="number" 
                    value={item.unit_price} 
                    onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                    className="h-9 md:h-8 md:text-right"
                    min="0"
                    required
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between md:justify-end">
                  <Label className="text-xs text-text-secondary md:hidden">Subtotal</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm md:mr-2">Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                    {/* Desktop Delete Button */}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-danger hover:bg-danger/10 hidden md:flex"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 border-t">
        <div className="flex-1 space-y-2">
          <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
          <Textarea 
            id="notes" 
            value={data.notes}
            onChange={(e) => setData({...data, notes: e.target.value})}
            placeholder="Masukkan catatan tambahan jika ada..." 
            className="resize-none h-20"
          />
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          <Label htmlFor="total_amount" className="block text-right">Total Keseluruhan</Label>
          <Input 
            id="total_amount" 
            type="number"
            value={data.total_amount}
            onChange={(e) => setData({...data, total_amount: Number(e.target.value)})}
            className="text-xl font-bold text-right h-12"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-light text-white">
          {isSubmitting ? 'Menyimpan...' : <><Check className="w-4 h-4 mr-2" /> Simpan Transaksi</>}
        </Button>
      </div>
    </form>
  );
}
