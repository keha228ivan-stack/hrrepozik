import { Upload } from "lucide-react";

interface FileUploadFieldProps {
  label: string;
  accept?: string;
}

export function FileUploadField({ label, accept }: FileUploadFieldProps) {
  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      <span className="mb-2 flex items-center gap-2 font-medium"><Upload className="h-4 w-4" />{label}</span>
      <input className="w-full text-sm" type="file" accept={accept} multiple />
    </label>
  );
}
