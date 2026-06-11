"use client";

import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { teacherUploadApi, type TeacherUploadType } from "@/lib/teacherApi";

type TeacherFileUploadButtonProps = {
  accept: string;
  label: string;
  uploadType: TeacherUploadType;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
};

export function TeacherFileUploadButton({
  accept,
  label,
  uploadType,
  disabled,
  onUploaded,
  onError,
}: TeacherFileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isUploading) return;

    try {
      setIsUploading(true);
      const response = await teacherUploadApi.uploadFile(file, uploadType);
      const uploadedUrl = response.data?.url;

      if (!uploadedUrl) {
        throw new Error("Upload thành công nhưng không nhận được URL file.");
      }

      onUploaded(uploadedUrl);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      onError?.(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Không thể upload file. Vui lòng thử lại.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        isLoading={isUploading}
        disabled={disabled || isUploading}
        leftIcon={<UploadCloud className="h-4 w-4" />}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  );
}
