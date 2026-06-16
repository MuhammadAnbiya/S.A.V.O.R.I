import { Loader2 } from "lucide-react";

export default function InputDataLoading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-text-primary">Memuat Form...</h2>
      <p className="text-sm text-text-secondary mt-2">Mohon tunggu sebentar</p>
    </div>
  );
}
