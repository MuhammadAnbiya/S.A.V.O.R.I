'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Check } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'Nama item wajib diisi'),
  quantity: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().int('Qty harus berupa angka bulat').min(1, 'Qty minimal 1')
  ),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pcs'),
  unit_price: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().positive('Harga harus lebih besar dari 0')
  )
});

const transactionSchema = z.object({
  vendor_name: z.string().min(1, 'Nama vendor/pelanggan wajib diisi'),
  transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi'),
  type: z.string().min(1, 'Jenis transaksi wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  payment_method: z.string().min(1, 'Metode pembayaran wajib diisi'),
  branch: z.string().min(1, 'Cabang wajib diisi').default('Pusat'),
  notes: z.string().optional(),
  total_amount: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().positive('Total harus lebih besar dari 0')
  ),
  items: z.array(itemSchema).min(1, 'Minimal harus ada 1 item')
});

export default function ManualInputForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  
  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      vendor_name: initialData?.vendor_name || initialData?.vendor || '',
      transaction_date: initialData?.transaction_date || initialData?.date || '',
      type: initialData?.type || 'Pengeluaran',
      category: initialData?.category || 'Operasional',
      payment_method: initialData?.payment_method || 'Cash',
      branch: initialData?.branch || 'Pusat',
      notes: initialData?.notes || '',
      total_amount: initialData?.total_amount || initialData?.amount || 0,
      items: initialData?.items && initialData.items.length > 0 
        ? initialData.items.map((item: any) => ({
            name: item.name || '',
            quantity: item.qty || item.quantity || 1,
            unit: item.unit || 'pcs',
            unit_price: item.price || item.unit_price || 0,
          })) 
        : [
            {
              name: '',
              quantity: 1,
              unit: 'pcs',
              unit_price: 0
            }
          ]
    }
  });

  const formErrors = errors as any;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  // Automatically calculate and set the total_amount when items change
  useEffect(() => {
    if (!watchedItems) return;
    const total = watchedItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
    setValue("total_amount", total);
  }, [watchedItems, setValue]);

  const preventInvalidNumberChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const preventInvalidIntegerChars = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '-', '+', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const onSubmit = async (values: any) => {
    try {
      const payload = {
        vendor_name: values.vendor_name,
        transaction_date: values.transaction_date,
        amount: values.total_amount,
        type: values.type,
        category: values.category,
        payment_method: values.payment_method,
        branch: values.branch,
        notes: values.notes,
        status: 'Verified',
        source: 'Manual',
        items: values.items.map((item: any) => ({
          name: item.name,
          qty: item.quantity,
          unit: item.unit,
          price: item.unit_price,
          subtotal: item.quantity * item.unit_price
        }))
      };

      const url = initialData?.id ? `/api/transactions/${initialData.id}` : '/api/transactions';
      const method = initialData?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Gagal menyimpan transaksi');

      toast.success(initialData?.id ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!');
      router.push('/dashboard/database');
      if (initialData?.id) window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan transaksi ke database.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Jenis Transaksi</Label>
          <select 
            id="type" 
            {...register("type")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Pengeluaran">Pengeluaran</option>
            <option value="Pemasukan">Pemasukan</option>
          </select>
          {formErrors.type && <p className="text-xs text-danger font-medium mt-1">{formErrors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select 
            id="category" 
            {...register("category")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Operasional">Operasional</option>
            <option value="Peralatan">Peralatan</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Transportasi">Transportasi</option>
          </select>
          {formErrors.category && <p className="text-xs text-danger font-medium mt-1">{formErrors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor / Pelanggan</Label>
          <Input 
            id="vendor" 
            placeholder="Ketik nama vendor..." 
            {...register("vendor_name")}
          />
          {formErrors.vendor_name && <p className="text-xs text-danger font-medium mt-1">{formErrors.vendor_name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date">Tanggal Transaksi</Label>
          <Input 
            id="date" 
            type="date" 
            {...register("transaction_date")}
          />
          {formErrors.transaction_date && <p className="text-xs text-danger font-medium mt-1">{formErrors.transaction_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Cabang</Label>
          <Input 
            id="branch" 
            placeholder="Contoh: Pusat, Cabang 1"
            {...register("branch")}
          />
          {formErrors.branch && <p className="text-xs text-danger font-medium mt-1">{formErrors.branch.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Metode Pembayaran</Label>
          <select 
            id="payment_method" 
            {...register("payment_method")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          {formErrors.payment_method && <p className="text-xs text-danger font-medium mt-1">{formErrors.payment_method.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Daftar Item</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', quantity: 1, unit: 'pcs', unit_price: 0 })}>
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
            {fields.map((field, index) => {
              const qty = watch(`items.${index}.quantity`);
              const price = watch(`items.${index}.unit_price`);
              const subtotal = (Number(qty) || 0) * (Number(price) || 0);

              return (
                <div 
                  key={field.id} 
                  className="relative bg-white border rounded-lg p-3 shadow-sm md:grid md:grid-cols-12 md:gap-2 md:items-center md:border-0 md:border-b md:last:border-0 md:rounded-none md:shadow-none md:p-2"
                >
                  {/* Mobile Header */}
                  <div className="flex justify-between items-center mb-2 md:hidden">
                    <span className="text-xs font-semibold text-text-tertiary uppercase">Item {index + 1}</span>
                    {fields.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-danger hover:bg-danger/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="col-span-4 mb-2 md:mb-0">
                    <Label className="text-xs text-text-secondary md:hidden mb-1 block">Nama Item</Label>
                    <Input 
                      {...register(`items.${index}.name` as const)}
                      className="h-9 md:h-8"
                      placeholder="Nama barang..."
                    />
                    {formErrors.items?.[index]?.name && (
                      <p className="text-xs text-danger font-medium mt-1">{formErrors.items[index]?.name?.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2 md:mb-0 md:col-span-4">
                    <div>
                      <Label className="text-xs text-text-secondary md:hidden mb-1 block">Qty</Label>
                      <Input 
                        type="number" 
                        {...register(`items.${index}.quantity` as const)}
                        className="h-9 md:h-8"
                        min="1"
                        step="1"
                        onKeyDown={preventInvalidIntegerChars}
                      />
                      {formErrors.items?.[index]?.quantity && (
                        <p className="text-xs text-danger font-medium mt-1">{formErrors.items[index]?.quantity?.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-text-secondary md:hidden mb-1 block">Satuan</Label>
                      <Input 
                        {...register(`items.${index}.unit` as const)}
                        className="h-9 md:h-8"
                        placeholder="pcs, kg..."
                      />
                      {formErrors.items?.[index]?.unit && (
                        <p className="text-xs text-danger font-medium mt-1">{formErrors.items[index]?.unit?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 mb-2 md:mb-0">
                    <Label className="text-xs text-text-secondary md:hidden mb-1 block">Harga Satuan</Label>
                    <Input 
                      type="number" 
                      {...register(`items.${index}.unit_price` as const)}
                      className="h-9 md:h-8 md:text-right"
                      min="0.01"
                      step="any"
                      onKeyDown={preventInvalidNumberChars}
                    />
                    {formErrors.items?.[index]?.unit_price && (
                      <p className="text-xs text-danger font-medium mt-1">{formErrors.items[index]?.unit_price?.message}</p>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-between md:justify-end">
                    <Label className="text-xs text-text-secondary md:hidden">Subtotal</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm md:mr-2">Rp {subtotal.toLocaleString('id-ID')}</span>
                      {/* Desktop Delete Button */}
                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-danger hover:bg-danger/10 hidden md:flex"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {formErrors.items && !Array.isArray(formErrors.items) && (
          <p className="text-sm text-danger font-medium mt-1">{(formErrors.items as any).message}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 border-t">
        <div className="flex-1 space-y-2">
          <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
          <Textarea 
            id="notes" 
            {...register("notes")}
            placeholder="Masukkan catatan tambahan jika ada..." 
            className="resize-none h-20"
          />
        </div>
        
        <div className="w-full md:w-64 space-y-2">
          <Label htmlFor="total_amount" className="block text-right">Total Keseluruhan</Label>
          <Input 
            id="total_amount" 
            type="number"
            {...register("total_amount")}
            className="text-xl font-bold text-right h-12"
            onKeyDown={preventInvalidNumberChars}
          />
          {formErrors.total_amount && <p className="text-xs text-danger font-medium mt-1 text-right">{formErrors.total_amount.message}</p>}
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
