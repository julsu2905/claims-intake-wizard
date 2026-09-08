"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Checkbox, Form, Tag, type FormInstance } from "antd";
import { ClaimDocumentUpload } from "../form/claim-document-upload";
import { getDocumentRequirements } from "../../data/claim-document-requirements";
import {
  type ClaimDocumentType,
  type ClaimType,
  type ClaimWizardDraft,
  type UploadedClaimDocument,
} from "../../stores/claim-wizard-store";

interface DocumentUploadStepProps {
  form: FormInstance<ClaimWizardDraft>;
  onDraftChange: () => void;
}

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const labelsByClaimType: Record<ClaimType, string> = {
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  dental: "Dental",
};

async function deleteTemporaryDocument(fileName: string) {
  try {
    await fetch(`${apiBaseUrl}/api/documents/${encodeURIComponent(fileName)}`, {
      method: "DELETE",
    });
  } catch {
    // Cleanup is best-effort. The server retention job handles abandoned files.
  }
}

export function DocumentUploadStep({
  form,
  onDraftChange,
}: DocumentUploadStepProps) {
  const claimType = Form.useWatch("claimType", form) as ClaimType | undefined;
  const files = (Form.useWatch(["documents", "files"], form) ?? {}) as Partial<
    Record<ClaimDocumentType, UploadedClaimDocument>
  >;
  const isMajorDental = Boolean(
    Form.useWatch(["documents", "isMajorDental"], form),
  );
  const requirements = useMemo(
    () => getDocumentRequirements(claimType, isMajorDental),
    [claimType, isMajorDental],
  );
  const visibleDocumentTypes = useMemo(
    () => new Set(requirements.map((requirement) => requirement.type)),
    [requirements],
  );

  const handleUploaded = useCallback(
    (
      documentType: ClaimDocumentType,
      document: UploadedClaimDocument,
      previousDocument?: UploadedClaimDocument,
    ) => {
      form.setFieldValue(["documents", "files", documentType], document);
      form
        .validateFields([["documents", "files", documentType]])
        .catch(() => undefined);
      onDraftChange();

      if (previousDocument) {
        deleteTemporaryDocument(previousDocument.fileName);
      }
    },
    [form, onDraftChange],
  );

  const removeDocument = useCallback(
    (documentType: ClaimDocumentType, uploadedFile?: UploadedClaimDocument) => {
      form.setFieldValue(["documents", "files", documentType], undefined);
      onDraftChange();

      if (uploadedFile) {
        deleteTemporaryDocument(uploadedFile.fileName);
      }
    },
    [form, onDraftChange],
  );

  useEffect(() => {
    if (!claimType) {
      return;
    }

    Object.entries(files).forEach(([documentType, uploadedFile]) => {
      if (
        uploadedFile &&
        !visibleDocumentTypes.has(documentType as ClaimDocumentType)
      ) {
        removeDocument(documentType as ClaimDocumentType, uploadedFile);
      }
    });
  }, [claimType, files, removeDocument, visibleDocumentTypes]);

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        Step 4 - Document Upload
      </legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Upload the documents needed for this claim type. Each file can be PDF,
        JPG, or PNG and must be 10MB or smaller.
      </p>

      {claimType ? (
        <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-950">
                {labelsByClaimType[claimType]} document checklist
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Required documents must be uploaded before continuing.
              </p>
            </div>
            <Tag color="blue" className="w-fit">
              {requirements.filter((item) => item.required).length} required
            </Tag>
          </div>

          {claimType === "dental" ? (
            <Form.Item
              className="mt-4 mb-0"
              name={["documents", "isMajorDental"]}
              valuePropName="checked"
            >
              <Checkbox onChange={onDraftChange}>
                This is major dental treatment
              </Checkbox>
            </Form.Item>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-sky-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Select a claim type in Step 1 to see the required and optional
          documents for this claim.
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {requirements.map((requirement) => {
          const uploadedFile = files[requirement.type];

          return (
            <ClaimDocumentUpload
              apiBaseUrl={apiBaseUrl}
              description={requirement.description}
              documentType={requirement.type}
              key={requirement.type}
              name={["documents", "files", requirement.type]}
              required={requirement.required}
              title={requirement.title}
              uploadedFile={uploadedFile}
              onRemoved={removeDocument}
              onUploaded={handleUploaded}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
