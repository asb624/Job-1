import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Trash, UploadCloud } from "lucide-react";

interface FileUploadProps {
  onFilesSelected: (urls: string[]) => void;
  initialFiles?: string[];
  maxFiles?: number;
  accept?: string;
  label?: string;
}

export function FileUpload({
  onFilesSelected,
  initialFiles = [],
  maxFiles = 5,
  accept = "image/*",
  label
}: FileUploadProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<string[]>(initialFiles);
  const [previewImages, setPreviewImages] = useState<string[]>(initialFiles);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: t("common.error"),
        description: t("fileUpload.tooManyFiles", { count: maxFiles }),
        variant: "destructive",
      });
      return;
    }

    const newFiles: string[] = [];
    const newPreviewImages: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: t("common.error"),
          description: t("fileUpload.onlyImages"),
          variant: "destructive",
        });
        return;
      }

      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        newPreviewImages.push(result);
        newFiles.push(result);
        
        if (newFiles.length === selectedFiles.length) {
          const updatedFiles = [...files, ...newFiles];
          const updatedPreviews = [...previewImages, ...newPreviewImages];
          setFiles(updatedFiles);
          setPreviewImages(updatedPreviews);
          onFilesSelected(updatedFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files];
    const updatedPreviews = [...previewImages];
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setFiles(updatedFiles);
    setPreviewImages(updatedPreviews);
    onFilesSelected(updatedFiles);
  };

  return (
    <div className="space-y-4">
      {label && <p className="text-sm font-medium">{label}</p>}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {previewImages.map((preview, index) => (
          <div key={index} className="relative group aspect-square border rounded-md overflow-hidden">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash className="h-6 w-6" />
            </button>
          </div>
        ))}

        {files.length < maxFiles && (
          <label className="cursor-pointer border-2 border-dashed rounded-md flex flex-col items-center justify-center aspect-square hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <UploadCloud className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("fileUpload.dragDrop")}</p>
              <p className="text-xs text-muted-foreground mt-1">{files.length} / {maxFiles}</p>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </label>
        )}
      </div>
    </div>
  );
}