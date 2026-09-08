import { isAxiosError } from "axios";
import { apiClient } from "./api-client";
import {
  type ClaimDocumentType,
  type UploadedClaimDocument,
} from "../stores/claim-wizard-store";

export interface ApiResponse<TData> {
  status: "success" | "error";
  message?: string;
  data?: TData;
}

export interface UploadClaimDocumentOptions {
  documentType: ClaimDocumentType;
  file: File;
  signal?: AbortSignal;
  onUploadProgress?: (percent: number) => void;
}

export async function uploadClaimDocument({
  documentType,
  file,
  signal,
  onUploadProgress,
}: UploadClaimDocumentOptions) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post<ApiResponse<UploadedClaimDocument>>(
      `/api/documents/${documentType}/upload`,
      formData,
      {
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }

          onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
        },
        signal,
      },
    );

    if (response.data.status !== "success" || !response.data.data) {
      throw new Error(response.data.message ?? "Unable to upload this file.");
    }

    return response.data.data;
  } catch (error) {
    if (isAxiosError<ApiResponse<UploadedClaimDocument>>(error)) {
      throw new Error(
        error.response?.data.message ?? "Upload failed. Try again.",
      );
    }

    throw error;
  }
}

export async function deleteClaimDocument(document: UploadedClaimDocument) {
  await apiClient.delete<ApiResponse<{ deleted: boolean; documentId: string }>>(
    `/api/documents/${encodeURIComponent(document.id)}`,
    {
      data: {
        fileName: document.fileName,
      },
    },
  );
}
