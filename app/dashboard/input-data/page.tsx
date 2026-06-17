'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CameraScanner from "@/components/receipt/CameraScanner";
import FileUploader from "@/components/receipt/FileUploader";
import ManualInputForm from "@/components/receipt/ManualInputForm";
import VoiceUploader from "@/components/receipt/VoiceUploader";
import { Camera, UploadCloud, Edit3, Mic } from "lucide-react";

export default function InputDataUnifiedPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Input Data Transaksi</h1>
        <p className="text-sm text-text-secondary mt-1">
          Pilih metode untuk memasukkan data struk atau transaksi Anda ke dalam sistem.
        </p>
      </div>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 mb-8 h-auto min-h-[3.5rem] !p-1.5 bg-white border border-border !rounded-full shadow-sm">
          <TabsTrigger value="voice" className="text-xs sm:text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm flex items-center justify-center">
            <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Suara</span>
          </TabsTrigger>
          <TabsTrigger value="scanner" className="text-xs sm:text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm flex items-center justify-center">
            <Camera className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Kamera</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs sm:text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm flex items-center justify-center">
            <UploadCloud className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1 sm:mr-2 flex-shrink-0" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="text-xs sm:text-sm md:text-base font-semibold !rounded-full !h-full transition-all duration-200 hover:text-ink hover:bg-surface-soft/40 data-[state=active]:!bg-primary data-[state=active]:!text-white data-[state=active]:shadow-sm flex items-center justify-center">
            <Edit3 className="w-4 h-4 sm:w-4.5 sm:h-4.5 mr-1 sm:mr-2 flex-shrink-0" />
            <span>Manual</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="mt-0">
          <VoiceUploader />
        </TabsContent>

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
