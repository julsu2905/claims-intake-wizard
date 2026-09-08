"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Form, notification, type FormInstance } from "antd";
import {
  ClaimWizardShell,
  type ClaimWizardStep,
} from "../components/claim-wizard-shell";
import { ClaimTypeStep } from "../components/steps/claim-type-step";
import { DiagnosisTreatmentStep } from "../components/steps/diagnosis-treatment-step";
import { DocumentUploadStep } from "../components/steps/document-upload-step";
import { MemberPolicyStep } from "../components/steps/member-policy-step";
import { ReviewSubmitStep } from "../components/steps/review-submit-step";
import { getRequiredDocumentTypes } from "../data/claim-document-requirements";
import { primaryMemberPolicy } from "../data/mock-policy";
import {
  type ClaimWizardDraft,
  useClaimWizardStore,
} from "../stores/claim-wizard-store";
import { sanitizeClaimDraft } from "../utils/claim-draft";

const claimSteps: ClaimWizardStep[] = [
  {
    key: "claimant",
    title: "Claim type",
    description: "Choose the care category",
  },
  {
    key: "member-policy",
    title: "Member & policy",
    description: "Confirm claimant coverage",
  },
  {
    key: "policy",
    title: "Diagnosis & treatment",
    description: "Care details and provider",
  },
  {
    key: "documents",
    title: "Documents",
    description: "Evidence and supporting files",
  },
  {
    key: "review",
    title: "Review and submit",
    description: "Confirm everything before submission",
  },
];

type FieldNamePath = string | readonly string[];

interface FormValidationError {
  errorFields?: {
    name: FieldNamePath;
    errors: string[];
  }[];
}

function isFormValidationError(error: unknown): error is FormValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "errorFields" in error &&
    Array.isArray((error as FormValidationError).errorFields)
  );
}

function getStepFieldNames(
  step: number,
  claimType?: ClaimWizardDraft["claimType"],
  isMajorDental?: boolean,
): FieldNamePath[] {
  if (step === 0) {
    return ["claimType"];
  }

  if (step === 1) {
    return [
      ["memberPolicy", "claimFor"],
      ["memberPolicy", "dependentId"],
      ["memberPolicy", "memberName"],
      ["memberPolicy", "policyNumber"],
      ["memberPolicy", "memberId"],
      ["memberPolicy", "dateOfBirth"],
    ];
  }

  if (step === 2) {
    const sharedFields: FieldNamePath[] = [
      ["diagnosisTreatment", "diagnosisDescription"],
      ["diagnosisTreatment", "icd10Code"],
      ["diagnosisTreatment", "providerName"],
    ];

    if (claimType === "inpatient") {
      return [
        ...sharedFields,
        ["diagnosisTreatment", "treatmentStartDate"],
        ["diagnosisTreatment", "treatmentEndDate"],
        ["diagnosisTreatment", "admissionReason"],
      ];
    }

    return [...sharedFields, ["diagnosisTreatment", "treatmentDate"]];
  }

  if (step === 3) {
    return getRequiredDocumentTypes(claimType, Boolean(isMajorDental)).map(
      (documentType) => ["documents", "files", documentType],
    );
  }

  if (step === 4) {
    return [["review", "confirmedAccuracy"]];
  }

  return [];
}

function getSubmissionFieldNames(
  claimType: ClaimWizardDraft["claimType"],
  isMajorDental: boolean,
) {
  return claimSteps.flatMap((_step, index) =>
    getStepFieldNames(index, claimType, isMajorDental),
  );
}

function getNavigationFieldNames(
  fromStep: number,
  targetStep: number,
  claimType: ClaimWizardDraft["claimType"],
  isMajorDental: boolean,
) {
  if (targetStep <= fromStep) {
    return [];
  }

  return claimSteps
    .slice(fromStep, targetStep)
    .flatMap((_step, offset) =>
      getStepFieldNames(fromStep + offset, claimType, isMajorDental),
    );
}

function getCurrentDraft(
  form: FormInstance<ClaimWizardDraft>,
): ClaimWizardDraft {
  return sanitizeClaimDraft({
    ...form.getFieldsValue(true),
  });
}

function StepPanel({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive: boolean;
}) {
  return (
    <div aria-hidden={!isActive} hidden={!isActive}>
      {children}
    </div>
  );
}

export default function Home() {
  const [form] = Form.useForm<ClaimWizardDraft>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationApi, notificationContextHolder] =
    notification.useNotification();
  const currentStep = useClaimWizardStore((state) => state.currentStep);
  const draft = useClaimWizardStore((state) => state.draft);
  const setCurrentStep = useClaimWizardStore((state) => state.setCurrentStep);
  const setDraft = useClaimWizardStore((state) => state.setDraft);
  const claimType = Form.useWatch("claimType", form) ?? draft.claimType;
  const isMajorDental = Boolean(
    Form.useWatch(["documents", "isMajorDental"], form) ??
    draft.documents?.isMajorDental,
  );

  useEffect(() => {
    form.setFieldsValue({
      ...sanitizeClaimDraft(draft),
    });
  }, [draft, form]);

  const goToStep = (step: number) => {
    setCurrentStep(Math.min(Math.max(step, 0), claimSteps.length - 1));
  };

  const persistFormDraft = () => {
    setDraft(getCurrentDraft(form));
  };

  const showValidationError = (error: unknown) => {
    if (!isFormValidationError(error)) {
      notificationApi.error({
        title: "Unable to continue",
        description: "Please try again or refresh the page.",
      });
      return;
    }

    const firstError = error.errorFields?.[0];

    if (firstError) {
      form.scrollToField(firstError.name, {
        behavior: "smooth",
        block: "center",
        focus: true,
      });
    }

    notificationApi.warning({
      title: "Complete the required fields first",
      description:
        firstError?.errors[0] ??
        "Review the highlighted fields before moving ahead.",
      placement: "topRight",
    });
  };

  const goForward = async (targetStep: number) => {
    try {
      const fieldsToValidate = getNavigationFieldNames(
        currentStep,
        targetStep,
        claimType,
        isMajorDental,
      );

      await form.validateFields(fieldsToValidate);
      persistFormDraft();
      goToStep(targetStep);
    } catch (error) {
      showValidationError(error);
    }
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      persistFormDraft();
      goToStep(step);
      return;
    }

    goForward(step);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await form.validateFields(
        getSubmissionFieldNames(claimType, isMajorDental),
      );
      const submission = getCurrentDraft(form);

      console.log("Mock claim submission", submission);
      persistFormDraft();
      notificationApi.success({
        title: "Claim submitted",
        description:
          "Mock submission complete. The claim payload was logged to the console.",
        placement: "topRight",
      });
    } catch (error) {
      showValidationError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notificationContextHolder}
      <Form
        component={false}
        form={form}
        initialValues={draft}
        layout="vertical"
        requiredMark
      >
        <ClaimWizardShell
          steps={claimSteps}
          currentStep={currentStep}
          onBack={() => {
            persistFormDraft();
            goToStep(currentStep - 1);
          }}
          onNext={() =>
            currentStep === claimSteps.length - 1
              ? handleSubmit()
              : goForward(currentStep + 1)
          }
          onStepChange={handleStepChange}
          nextLabel={
            currentStep === claimSteps.length - 1 ? "Submit" : "Continue"
          }
          canGoNext={Boolean(claimType)}
          isNextLoading={isSubmitting}
        >
          <StepPanel isActive={currentStep === 0}>
            <ClaimTypeStep form={form} onDraftChange={persistFormDraft} />
          </StepPanel>
          <StepPanel isActive={currentStep === 1}>
            <MemberPolicyStep form={form} onDraftChange={persistFormDraft} />
          </StepPanel>
          <StepPanel isActive={currentStep === 2}>
            <DiagnosisTreatmentStep form={form} />
          </StepPanel>
          <StepPanel isActive={currentStep === 3}>
            <DocumentUploadStep form={form} onDraftChange={persistFormDraft} />
          </StepPanel>
          <StepPanel isActive={currentStep === 4}>
            <ReviewSubmitStep form={form} onEditStep={goToStep} />
          </StepPanel>
        </ClaimWizardShell>
      </Form>
    </>
  );
}
