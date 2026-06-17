'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraScanner from "@/components/receipt/CameraScanner";
import FileUploader from "@/components/receipt/FileUploader";
import ManualInputForm from "@/components/receipt/ManualInputForm";
import { Camera, UploadCloud, Edit3 } from "lucide-react";

export default function InputDataUnifiedPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Input Data Transaksi</h1>
        <p className="text-sm text-text-secondary mt-1">
          Pilih metode untuk memasukkan data struk atau transaksi Anda ke dalam sistem.
        </p>
      </div>

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 !h-14 !p-1.5 bg-white border border-border !rounded-full shadow-sm">
          <TabsTrigger value="scanner" className="text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm">
            <Camera className="w-4.5 h-4.5 mr-2" /> Scanner Kamera
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm">
            <UploadCloud className="w-4.5 h-4.5 mr-2" /> Upload File
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm">
            <Edit3 className="w-4.5 h-4.5 mr-2" /> Input Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-0">
          <CameraScanner />
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <FileUploader />
        </TabsContent>

        <TabsContent value="manual" className="mt-0">
          <div className="bg-bg-card rounded-lg shadow-sm border border-border p-6">
            <ManualInputForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
