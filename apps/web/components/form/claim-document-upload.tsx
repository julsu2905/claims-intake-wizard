"use client";

import { useEffect, useState } from "react";
import {
  Form,
  Tag,
  Upload,
  type FormItemProps,
  type UploadFile,
  type UploadProps,
} from "antd";
import clsx from "clsx";
import {
  type ClaimDocumentType,
  type UploadedClaimDocument,
} from "../../stores/claim-wizard-store";

interface UploadApiResponse {
  status: "success" | "error";
  message?: string;
  data?: UploadedClaimDocument;
}

interface ClaimDocumentUploadProps {
  apiBaseUrl: string;
  description: string;
  documentType: ClaimDocumentType;
  name: FormItemProps["name"];
  required: boolean;
  title: string;
  uploadedFile?: UploadedClaimDocument;
  onUploaded: (
    documentType: ClaimDocumentType,
    document: UploadedClaimDocument,
    previousDocument?: UploadedClaimDocument,
  ) => void;
  onRemoved: (
    documentType: ClaimDocumentType,
    document?: UploadedClaimDocument,
  ) => void;
}

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
const acceptedFileTypes =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
const { Dragger } = Upload;

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function getFileValidationError(file: File) {
  if (!allowedMimeTypes.includes(file.type)) {
    return "Only PDF, JPG, and PNG files are supported.";
  }

  if (file.size > maxFileSizeBytes) {
    return "File must be 10MB or smaller.";
  }

  return undefined;
}

function parseUploadResponse(responseText: string) {
  try {
    return JSON.parse(responseText) as UploadApiResponse;
  } catch {
    return {
      status: "error",
      message: "Unexpected upload response.",
    } satisfies UploadApiResponse;
  }
}

function getFileList(uploadedFile?: UploadedClaimDocument): UploadFile[] {
  if (!uploadedFile) {
    return [];
  }

  return [
    {
      uid: uploadedFile.id,
      name: uploadedFile.originalName,
      size: uploadedFile.size,
      status: "done",
      type: uploadedFile.mimeType,
      url: uploadedFile.url,
    },
  ];
}

export function ClaimDocumentUpload({
  apiBaseUrl,
  description,
  documentType,
  name,
  required,
  title,
  uploadedFile,
  onUploaded,
  onRemoved,
}: ClaimDocumentUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>(
    getFileList(uploadedFile),
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    setFileList(getFileList(uploadedFile));
  }, [uploadedFile]);

  const handleUpload: UploadProps["customRequest"] = (options) => {
    const { file, onError, onProgress, onSuccess } = options;

    if (!(file instanceof File)) {
      onError?.(new Error("Unsupported file object."));
      return;
    }

    const request = new XMLHttpRequest();
    const formData = new FormData();
    const previousDocument = uploadedFile;

    formData.append("file", file);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress?.({
        percent: Math.round((event.loaded / event.total) * 100),
      });
    };

    request.onload = () => {
      const response = parseUploadResponse(request.responseText);

      if (request.status >= 200 && request.status < 300 && response.data) {
        setErrorMessage(undefined);
        onUploaded(documentType, response.data, previousDocument);
        onSuccess?.(response);
        return;
      }

      const error = new Error(
        response.message ?? "Unable to upload this file.",
      );
      setErrorMessage(error.message);
      onError?.(error);
    };

    request.onerror = () => {
      const error = new Error("Upload failed. Try again.");
      setErrorMessage(error.message);
      onError?.(error);
    };

    request.open("POST", `${apiBaseUrl}/api/documents/${documentType}/upload`);
    request.send(formData);

    return {
      abort: () => request.abort(),
    };
  };

  return (
    <div
      className={clsx(
        "rounded-lg border bg-white p-4 transition-colors motion-reduce:transition-none",
        required ? "border-primary-100" : "border-sky-100",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <Tag color={required ? "blue" : "default"}>
              {required ? "Required" : "Optional"}
            </Tag>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          {uploadedFile ? (
            <p className="mt-3 truncate text-sm font-medium text-slate-800">
              {uploadedFile.originalName}
              <span className="ml-2 font-normal text-slate-500">
                {formatFileSize(uploadedFile.size)}
              </span>
            </p>
          ) : null}
          {uploadedFile?.expiresAt ? (
            <p className="mt-1 text-xs text-slate-500">
              Temporary upload expires after{" "}
              {new Date(uploadedFile.expiresAt).toLocaleDateString()}.
            </p>
          ) : null}
        </div>

        <div className="w-full sm:w-80">
          <Form.Item
            className="mb-0"
            getValueProps={() => ({})}
            name={name}
            rules={[
              {
                required,
                message: `Upload ${title.toLowerCase()}.`,
              },
            ]}
          >
            <Dragger
              accept={acceptedFileTypes}
              beforeUpload={(file) => {
                const validationError = getFileValidationError(file);

                if (validationError) {
                  setErrorMessage(validationError);
                  return Upload.LIST_IGNORE;
                }

                setErrorMessage(undefined);
                return true;
              }}
              customRequest={handleUpload}
              fileList={fileList}
              maxCount={1}
              onChange={({ fileList: nextFileList }) =>
                setFileList(nextFileList.slice(-1))
              }
              onRemove={() => {
                onRemoved(documentType, uploadedFile);
                return true;
              }}
              progress={{
                showInfo: true,
                strokeWidth: 4,
              }}
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900">
                  {uploadedFile ? "Replace document" : "Drop file here"}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  PDF, JPG, or PNG. Max 10MB.
                </p>
              </div>
            </Dragger>
          </Form.Item>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
