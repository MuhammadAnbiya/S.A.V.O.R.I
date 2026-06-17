'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, AlertCircle, Check } from 'lucide-react';

interface ExtractionResultProps {
  initialData: any;
  onCancel?: () => void;
  source?: string;
}

export default function ExtractionResult({ initialData, onCancel, source = 'Scanner' }: ExtractionResultProps) {
  const router = useRouter();
  const [data, setData] = useState({
    vendor_name: initialData?.vendor_name?.value || '',
    transaction_date: initialData?.transaction_date?.value || '',
    category: 'Operasional',
    branch: 'Pusat',
    payment_method: initialData?.payment_method || 'Cash',
    total_amount: initialData?.total_amount?.value || 0,
    items: (initialData?.items || []).map((item: any, id: number) => ({
      id: id.toString(),
      name: item.name?.value || '',
      quantity: item.quantity?.value || 1,
      unit: item.unit?.value || 'pcs',
      unit_price: item.unit_price?.value || 0,
      subtotal: item.subtotal?.value || 0,
      confidence: item.name?.confidence || 1
    }))
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confidence check helpers
  const isLowConfidence = (confidence?: number) => confidence !== undefined && confidence < 0.8;
  const vendorWarning = isLowConfidence(initialData?.vendor_name?.confidence);
  const dateWarning = isLowConfidence(initialData?.transaction_date?.confidence);
  const totalWarning = isLowConfidence(initialData?.total_amount?.confidence);

  const handleItemChange = (id: string, field: string, value: string | number) => {
    setData(prev => {
      const newItems = prev.items.map((item: any) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Auto-calculate subtotal if qty or price changes
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.subtotal = Number(updatedItem.quantity) * Number(updatedItem.unit_price);
          }
          return updatedItem;
        }
        return item;
      });

      // Auto-calculate total
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
          subtotal: 0,
          confidence: 1
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Recalculate all values at submit time to guarantee 100% arithmetic consistency
      const finalItems = data.items.map((item: any) => {
        const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
        const price = Math.max(0, Math.round(Number(item.unit_price) || 0));
        const subtotal = qty * price; // ALWAYS enforce arithmetic
        return {
          name: String(item.name || '').trim(),
          qty,
          unit: item.unit || 'pcs',
          price,
          subtotal,
          confidence: item.confidence
        };
      }).filter((item: any) => item.name.length > 0);

      const finalTotal = finalItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);

      const payload = {
        vendor_name: data.vendor_name.trim(),
        transaction_date: data.transaction_date,
        amount: finalTotal,
        type: 'Pengeluaran',
        category: data.category,
        branch: data.branch,
        payment_method: data.payment_method,
        status: 'Verified',
        source: source,
        items: finalItems,
      };

      const response = await fetch('/api/transactions', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan transaksi');
      }

      toast.success('Transaksi berhasil disimpan!');
      router.push('/dashboard/database');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-bg-card rounded-lg border border-border shadow-sm p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vendor_name" className="flex items-center">
              Nama Vendor / Toko
              {vendorWarning && <span className="ml-2 text-xs text-danger flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Perlu verifikasi</span>}
            </Label>
            <Input 
              id="vendor_name" 
              value={data.vendor_name}
              onChange={(e) => setData({...data, vendor_name: e.target.value})}
              className={vendorWarning ? 'border-danger focus-visible:ring-danger' : ''}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transaction_date" className="flex items-center">
              Tanggal Transaksi
              {dateWarning && <span className="ml-2 text-xs text-danger flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Perlu verifikasi</span>}
            </Label>
            <Input 
              id="transaction_date" 
              type="date"
              value={data.transaction_date}
              onChange={(e) => setData({...data, transaction_date: e.target.value})}
              className={dateWarning ? 'border-danger focus-visible:ring-danger' : ''}
            />
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
            <Label htmlFor="branch">Cabang</Label>
            <Input 
              id="branch" 
              placeholder="Contoh: Pusat, Cabang 1"
              value={data.branch}
              onChange={(e) => setData({...data, branch: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <select 
              id="payment_method" 
              value={data.payment_method}
              onChange={(e) => setData({...data, payment_method: e.target.value})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="Cash">Cash (Tunai)</option>
              <option value="QRIS">QRIS</option>
              <option value="DANA">DANA</option>
              <option value="GoPay">GoPay</option>
              <option value="OVO">OVO</option>
              <option value="ShopeePay">ShopeePay</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="Kartu Kredit">Kartu Kredit / Debit</option>
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
                {data.items.map((item: any) => {
                  const itemWarning = isLowConfidence(item.confidence);
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-2">
                        <Input 
                          value={item.name} 
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className={`h-8 ${itemWarning ? 'border-danger focus-visible:ring-danger' : ''}`}
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          className="h-8"
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
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number" 
                          value={item.subtotal} 
                          onChange={(e) => handleItemChange(item.id, 'subtotal', e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger hover:bg-danger/10" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <div className="space-y-1 w-full max-w-xs">
            <Label htmlFor="total_amount" className="flex items-center justify-between">
              Total Akhir
              {totalWarning && <span className="ml-2 text-xs text-danger flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Cek ulang</span>}
            </Label>
            <Input 
              id="total_amount" 
              type="number"
              value={data.total_amount}
              onChange={(e) => setData({...data, total_amount: Number(e.target.value)})}
              className={`text-lg font-bold text-right ${totalWarning ? 'border-danger focus-visible:ring-danger' : ''}`}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button 
            variant="outline" 
            onClick={() => onCancel ? onCancel() : router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button 
            className="bg-primary hover:bg-primary-light text-white" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : <><Check className="w-4 h-4 mr-2" /> Konfirmasi & Simpan</>}
          </Button>
        </div>
      </div>
    </Card>
  );
}
