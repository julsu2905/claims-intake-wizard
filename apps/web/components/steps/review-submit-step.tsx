"use client";

import { Button, Checkbox, Form, Tag, type FormInstance } from "antd";
import { documentLabels } from "../../data/claim-document-requirements";
import {
  type ClaimDocumentType,
  type ClaimType,
  type ClaimWizardDraft,
  type UploadedClaimDocument,
} from "../../stores/claim-wizard-store";
import { sanitizeClaimDraft } from "../../utils/claim-draft";

interface ReviewSubmitStepProps {
  form: FormInstance<ClaimWizardDraft>;
  onEditStep: (step: number) => void;
}

interface SummarySectionProps {
  title: string;
  step: number;
  children: React.ReactNode;
  onEditStep: (step: number) => void;
}

const claimTypeLabels: Record<ClaimType, string> = {
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  dental: "Dental",
};

const claimForLabels = {
  self: "Primary member",
  dependent: "Dependent",
} as const;

function SummarySection({
  title,
  step,
  children,
  onEditStep,
}: SummarySectionProps) {
  return (
    <section className="rounded-lg border border-sky-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3 border-b border-sky-100 pb-3">
        <div className="text-sm font-semibold text-slate-950">{title}</div>
        <Button size="small" onClick={() => onEditStep(step)}>
          Edit
        </Button>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{children}</div>
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-slate-900">
        {value || "Not provided"}
      </div>
    </div>
  );
}

function formatDateRange(values: ClaimWizardDraft) {
  const treatment = values.diagnosisTreatment;

  if (values.claimType === "inpatient") {
    return [treatment?.treatmentStartDate, treatment?.treatmentEndDate]
      .filter(Boolean)
      .join(" to ");
  }

  return treatment?.treatmentDate;
}

function getUploadedDocuments(
  files?: Partial<Record<ClaimDocumentType, UploadedClaimDocument>>,
) {
  if (!files) {
    return [];
  }

  return Object.entries(files).filter(
    (entry): entry is [ClaimDocumentType, UploadedClaimDocument] =>
      Boolean(entry[1]),
  );
}

export function ReviewSubmitStep({ form, onEditStep }: ReviewSubmitStepProps) {
  const values = sanitizeClaimDraft(
    form.getFieldsValue(true) as ClaimWizardDraft,
  );
  const uploadedDocuments = getUploadedDocuments(values.documents?.files);

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        Step 5 - Review & Submit
      </legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Review the full claim before submission. Use Edit to return to any
        section without losing the information already entered.
      </p>

      <div className="mt-6 grid gap-4">
        <SummarySection title="Claim type" step={0} onEditStep={onEditStep}>
          <SummaryItem
            label="Type"
            value={
              values.claimType ? claimTypeLabels[values.claimType] : undefined
            }
          />
        </SummarySection>

        <SummarySection
          title="Member & policy"
          step={1}
          onEditStep={onEditStep}
        >
          <SummaryItem
            label="Claim for"
            value={
              values.memberPolicy?.claimFor
                ? claimForLabels[values.memberPolicy.claimFor]
                : undefined
            }
          />
          <SummaryItem
            label="Member name"
            value={values.memberPolicy?.memberName}
          />
          <SummaryItem
            label="Policy number"
            value={values.memberPolicy?.policyNumber}
          />
          <SummaryItem
            label="Member ID"
            value={values.memberPolicy?.memberId}
          />
          <SummaryItem
            label="Date of birth"
            value={values.memberPolicy?.dateOfBirth}
          />
        </SummarySection>

        <SummarySection
          title="Diagnosis & treatment"
          step={2}
          onEditStep={onEditStep}
        >
          <SummaryItem
            label="Diagnosis"
            value={values.diagnosisTreatment?.diagnosisDescription}
          />
          <SummaryItem
            label="ICD-10 code"
            value={values.diagnosisTreatment?.icd10Code}
          />
          <SummaryItem
            label="Provider"
            value={values.diagnosisTreatment?.providerName}
          />
          <SummaryItem
            label="Treatment date(s)"
            value={formatDateRange(values)}
          />
          {values.claimType === "inpatient" && (
            <>
              <SummaryItem
                label="Admission reason"
                value={values.diagnosisTreatment?.admissionReason}
              />
              <SummaryItem
                label="Length of stay"
                value={
                  values.diagnosisTreatment?.lengthOfStay
                    ? `${values.diagnosisTreatment.lengthOfStay} day(s)`
                    : undefined
                }
              />
            </>
          )}
        </SummarySection>

        <SummarySection title="Documents" step={3} onEditStep={onEditStep}>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
              Uploaded files
            </dt>
            <dd className="mt-2">
              {uploadedDocuments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {uploadedDocuments.map(([documentType, document]) => (
                    <Tag
                      className="max-w-full py-1"
                      color="blue"
                      key={"docs-" + document.id}
                    >
                      <span className="font-medium">
                        {documentLabels[documentType]}:
                      </span>{" "}
                      {document.originalName}
                    </Tag>
                  ))}
                </div>
              ) : (
                <span className="text-slate-900">Not provided</span>
              )}
            </dd>
          </div>
          {values.claimType === "dental" && (
            <SummaryItem
              label="Major dental"
              value={values.documents?.isMajorDental ? "Yes" : "No"}
            />
          )}
        </SummarySection>
      </div>

      <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50 px-4 py-4">
        <Form.Item
          className="mb-0"
          name={"confirmedAccuracy"}
          rules={[
            {
              validator: async (_, value: boolean | undefined) => {
                if (value) {
                  return;
                }

                throw new Error("Confirm the information is accurate.");
              },
            },
          ]}
          valuePropName="checked"
        >
          <Checkbox>I confirm this information is accurate</Checkbox>
        </Form.Item>
      </div>
    </fieldset>
  );
}
