"use client";

import { useEffect } from "react";
import { AutoComplete, Form, Input, type FormInstance } from "antd";
import { DatePickerField } from "../form/date-picker-field";
import {
  commonIcd10Codes,
  providerSuggestions,
} from "../../data/mock-diagnosis";
import {
  type ClaimType,
  type ClaimWizardDraft,
} from "../../stores/claim-wizard-store";

interface DiagnosisTreatmentStepProps {
  form: FormInstance<ClaimWizardDraft>;
}

const icd10Options = commonIcd10Codes.map((item) => ({
  label: `${item.code} - ${item.description}`,
  value: item.code,
}));

const providerOptions = providerSuggestions.map((provider) => ({
  label: provider,
  value: provider,
}));

function calculateLengthOfStay(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return undefined;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return undefined;
  }

  const duration = end.getTime() - start.getTime();

  if (duration < 0) {
    return undefined;
  }

  return Math.max(Math.ceil(duration / 86_400_000), 1);
}

export function DiagnosisTreatmentStep({ form }: DiagnosisTreatmentStepProps) {
  const claimType = Form.useWatch("claimType", form) as ClaimType | undefined;
  const treatmentStartDate = Form.useWatch(
    ["diagnosisTreatment", "treatmentStartDate"],
    form,
  );
  const treatmentEndDate = Form.useWatch(
    ["diagnosisTreatment", "treatmentEndDate"],
    form,
  );
  const isInpatient = claimType === "inpatient";
  const lengthOfStay = isInpatient
    ? calculateLengthOfStay(treatmentStartDate, treatmentEndDate)
    : undefined;

  useEffect(() => {
    form.setFieldValue(["diagnosisTreatment", "lengthOfStay"], lengthOfStay);
  }, [form, lengthOfStay]);

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        Step 3 - Diagnosis & Treatment
      </legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Capture the diagnosis, treatment timing, and provider details. The
        treatment date fields adapt based on the selected claim type.
      </p>

      <div className="mt-6 grid gap-4">
        <Form.Item
          label="Diagnosis description"
          name={["diagnosisTreatment", "diagnosisDescription"]}
          rules={[
            {
              required: true,
              message: "Describe the diagnosis or symptoms.",
            },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 6 }}
            placeholder="Briefly describe the diagnosis, symptoms, or reason for care."
          />
        </Form.Item>

        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item
            label="ICD-10 code"
            name={["diagnosisTreatment", "icd10Code"]}
            rules={[
              {
                required: true,
                message: "Select or enter an ICD-10 code.",
              },
            ]}
          >
            <AutoComplete
              options={icd10Options}
              placeholder="Search by code or diagnosis"
              filterOption={(inputValue, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            label="Provider or hospital name"
            name={["diagnosisTreatment", "providerName"]}
            rules={[
              {
                required: true,
                message: "Enter the provider or hospital name.",
              },
            ]}
          >
            <AutoComplete
              options={providerOptions}
              placeholder="Start typing provider name"
              filterOption={(inputValue, option) =>
                String(option?.value ?? "")
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        </div>

        {isInpatient ? (
          <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DatePickerField
                label="Admission date"
                name={["diagnosisTreatment", "treatmentStartDate"]}
                rules={[
                  {
                    required: true,
                    message: "Enter the admission date.",
                  },
                ]}
              />

              <DatePickerField
                label="Discharge date"
                name={["diagnosisTreatment", "treatmentEndDate"]}
                rules={[
                  {
                    required: true,
                    message: "Enter the discharge date.",
                  },
                ]}
              />
            </div>

            <Form.Item
              label="Admission reason"
              name={["diagnosisTreatment", "admissionReason"]}
              rules={[
                {
                  required: true,
                  message: "Enter the reason for admission.",
                },
              ]}
            >
              <Input.TextArea
                autoSize={{ minRows: 3, maxRows: 5 }}
                placeholder="Summarize why inpatient care or admission was needed."
              />
            </Form.Item>

            <div className="rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700">
              <span className="font-medium text-slate-950">
                Length of stay:
              </span>{" "}
              {lengthOfStay ? `${lengthOfStay} day(s)` : "Calculated from dates"}
            </div>
          </div>
        ) : (
          <DatePickerField
            label="Treatment date"
            name={["diagnosisTreatment", "treatmentDate"]}
            rules={[
              {
                required: true,
                message: "Enter the treatment date.",
              },
            ]}
          />
        )}
      </div>
    </fieldset>
  );
}
