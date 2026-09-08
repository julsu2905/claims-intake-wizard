"use client";

import { Card, Form, Radio, Space, type FormInstance } from "antd";
import clsx from "clsx";
import {
  type ClaimType,
  type ClaimWizardDraft,
} from "../../stores/claim-wizard-store";

interface ClaimTypeOption {
  value: ClaimType;
  title: string;
  description: string;
  requiredLater: string;
}

interface ClaimTypeStepProps {
  form: FormInstance<ClaimWizardDraft>;
  onDraftChange: () => void;
}

const claimTypeOptions: ClaimTypeOption[] = [
  {
    value: "outpatient",
    title: "Outpatient",
    description:
      "For consultations, diagnostics, therapy, or treatment without an overnight stay.",
    requiredLater:
      "Receipts, medical report, prescription, and test results when available.",
  },
  {
    value: "inpatient",
    title: "Inpatient",
    description:
      "For hospital admissions, surgery, emergency care, or overnight treatment.",
    requiredLater:
      "Discharge summary, itemized bill, admission note, and provider records.",
  },
  {
    value: "dental",
    title: "Dental",
    description:
      "For dental treatment, oral surgery, orthodontics, or preventive dental care.",
    requiredLater:
      "Dental invoice, treatment plan, X-rays, and procedure notes when required.",
  },
];

function clearClaimTypeDependentFields(
  form: FormInstance<ClaimWizardDraft>,
  claimType: ClaimType,
) {
  if (claimType === "inpatient") {
    form.setFields([
      { name: ["diagnosisTreatment", "treatmentDate"], value: undefined },
    ]);
    return;
  }

  form.setFields([
    { name: ["diagnosisTreatment", "treatmentStartDate"], value: undefined },
    { name: ["diagnosisTreatment", "treatmentEndDate"], value: undefined },
    { name: ["diagnosisTreatment", "admissionReason"], value: undefined },
    { name: ["diagnosisTreatment", "lengthOfStay"], value: undefined },
  ]);
}

export function ClaimTypeStep({ form, onDraftChange }: ClaimTypeStepProps) {
  const claimType = Form.useWatch("claimType", form);

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        Step 1 - Claim Type Selection
      </legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Choose the category that best matches the care received. This selection
        determines which fields and supporting documents are required in the
        next steps.
      </p>

      <Form.Item
        className="mt-6 mb-0"
        name="claimType"
        rules={[{ required: true, message: "Select a claim type to continue." }]}
      >
        <Radio.Group>
          <Space orientation="horizontal" size={16} className="w-full">
            {claimTypeOptions.map((option) => {
              const isSelected = claimType === option.value;

              return (
                <Card
                  className={clsx(
                    "h-full cursor-pointer border transition-all duration-200 motion-reduce:transition-none",
                    isSelected
                      ? "border-primary-300 bg-primary-50 shadow-sm shadow-primary-100"
                      : "border-sky-100 bg-white hover:border-primary-200 hover:bg-primary-50/40",
                  )}
                  key={option.value}
                  onClick={() => {
                    form.setFieldValue("claimType", option.value);
                    clearClaimTypeDependentFields(form, option.value);
                    onDraftChange();
                  }}
                  classNames={{ body: "h-full p-6" }}
                >
                  <Radio className="h-full" value={option.value}>
                    <span className="block pl-1">
                      <span className="block text-base font-semibold text-slate-950">
                        {option.title}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">
                        {option.description}
                      </span>
                      <span className="mt-4 block border-t border-sky-100 pt-4 text-xs leading-5 text-slate-500">
                        {option.requiredLater}
                      </span>
                    </span>
                  </Radio>
                </Card>
              );
            })}
          </Space>
        </Radio.Group>
      </Form.Item>
    </fieldset>
  );
}
