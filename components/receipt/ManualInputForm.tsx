'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

      alert('Data berhasil disimpan!');
      router.push('/dashboard/database');
      // For refreshing parent components if used inside a modal
      if (data.id) window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Jenis Transaksi</Label>
          <select 
            id="type" 
            value={data.type}
            onChange={(e) => setData({...data, type: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
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
          <select 
            id="branch" 
            value={data.branch}
            onChange={(e) => setData({...data, branch: e.target.value})}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="pusat">Pusat</option>
            <option value="cabang_1">Cabang 1</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Daftar Item</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Item
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-3 text-left font-medium">Nama Item</th>
                <th className="p-3 text-left font-medium w-20">Qty</th>
                <th className="p-3 text-left font-medium w-24">Satuan</th>
                <th className="p-3 text-left font-medium w-32">Harga Satuan</th>
                <th className="p-3 text-left font-medium w-32">Subtotal</th>
                <th className="p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-2">
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                      className="h-8"
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="h-8"
                      min="0.01"
                      step="any"
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      value={item.unit} 
                      onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.unit_price} 
                      onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                      className="h-8"
                      min="0"
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.subtotal} 
                      onChange={(e) => handleItemChange(item.id, 'subtotal', e.target.value)}
                      className="h-8 bg-muted/30"
                      readOnly
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10" 
                      onClick={() => removeItem(item.id)}
                      disabled={data.items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
