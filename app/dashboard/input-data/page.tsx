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
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-white border border-border shadow-sm">
          <TabsTrigger value="scanner" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">
            <Camera className="w-4 h-4 mr-2" /> Scanner Kamera
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">
            <UploadCloud className="w-4 h-4 mr-2" /> Upload File
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">
            <Edit3 className="w-4 h-4 mr-2" /> Input Manual
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
