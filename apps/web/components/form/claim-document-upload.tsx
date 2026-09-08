"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Progress,
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
import { uploadClaimDocument } from "../../lib/claim-documents-api";

interface ClaimDocumentUploadProps {
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
type UploadableFile = File & { uid?: string };

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
      percent: 100,
      type: uploadedFile.mimeType,
      url: uploadedFile.url,
    },
  ];
}

function getUploadFile(file: UploadableFile, percent: number): UploadFile {
  return {
    uid: file.uid ?? file.name,
    name: file.name,
    size: file.size,
    status: "uploading",
    percent,
    type: file.type,
  };
}

function isUploadChangeEvent(
  event: unknown,
): event is { file?: UploadFile & { response?: UploadedClaimDocument } } {
  return typeof event === "object" && event !== null && "file" in event;
}

export function ClaimDocumentUpload({
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

  const activeFile = fileList[0];
  const isUploading = activeFile?.status === "uploading";
  const displayFile = uploadedFile ? getFileList(uploadedFile)[0] : activeFile;
  const progressPercent =
    typeof activeFile?.percent === "number"
      ? Math.round(activeFile.percent)
      : 0;

  const handleUpload: UploadProps["customRequest"] = (options) => {
    const { file, onError, onProgress, onSuccess } = options;

    if (!(file instanceof File)) {
      onError?.(new Error("Unsupported file object."));
      return;
    }

    const uploadFile = file as UploadableFile;
    const abortController = new AbortController();
    const previousDocument = uploadedFile;

    setFileList([getUploadFile(uploadFile, 0)]);

    void uploadClaimDocument({
      documentType,
      file: uploadFile,
      signal: abortController.signal,
      onUploadProgress: (nextPercent) => {
        setFileList([getUploadFile(uploadFile, nextPercent)]);
        onProgress?.({
          percent: nextPercent,
        });
      },
    })
      .then((document) => {
        setErrorMessage(undefined);
        setFileList(getFileList(document));
        onUploaded(documentType, document, previousDocument);
        onSuccess?.(document);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Upload failed. Try again.";

        setErrorMessage(message);
        setFileList([
          {
            ...getUploadFile(uploadFile, 0),
            status: "error",
          },
        ]);
        onError?.(new Error(message));
      });

    return {
      abort: () => abortController.abort(),
    };
  };

  return (
    <div
      className={clsx(
        "rounded-lg border bg-white p-4 transition-colors motion-reduce:transition-none",
        required ? "border-primary-100" : "border-sky-100",
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <Tag color={required ? "blue" : "default"}>
              {required ? "Required" : "Optional"}
            </Tag>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="w-full">
          <Form.Item
            className="mb-0"
            getValueFromEvent={(event: unknown) => {
              if (!isUploadChangeEvent(event)) {
                return uploadedFile;
              }

              if (event.file?.status === "removed") {
                return undefined;
              }

              return event.file?.response ?? uploadedFile;
            }}
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
              onChange={({ file, fileList: nextFileList }) => {
                if (uploadedFile && file.status === "done") {
                  setFileList(getFileList(uploadedFile));
                  return;
                }

                setFileList(nextFileList.slice(-1));
              }}
              onRemove={() => {
                onRemoved(documentType, uploadedFile);
                return true;
              }}
              progress={{
                showInfo: true,
                strokeWidth: 4,
              }}
              showUploadList={false}
            >
              <div className="px-3 py-3 text-left">
                {displayFile ? (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {displayFile.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {displayFile.size
                            ? formatFileSize(displayFile.size)
                            : ""}
                          {isUploading ? " - Uploading" : ""}
                        </p>
                      </div>
                      {uploadedFile && !isUploading && (
                        <Button
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onRemoved(documentType, uploadedFile);
                            setFileList([]);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {uploadedFile?.expiresAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Temporary upload expires after{" "}
                        {new Date(uploadedFile.expiresAt).toLocaleDateString()}.
                      </p>
                    )}
                    <Progress
                      className="mt-3"
                      percent={isUploading ? progressPercent : 100}
                      size="small"
                      status={
                        displayFile.status === "error" ? "exception" : undefined
                      }
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Drop another file here to replace it.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Drop file here
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Or click to browse. PDF, JPG, or PNG. Max 10MB.
                    </p>
                  </div>
                )}
              </div>
            </Dragger>
          </Form.Item>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
