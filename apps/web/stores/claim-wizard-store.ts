import { create } from "zustand";
import { persist } from "zustand/middleware";
import { primaryMemberPolicy } from "../data/mock-policy";

export type ClaimType = "outpatient" | "inpatient" | "dental";

export type ClaimFor = "self" | "dependent";

export interface MemberPolicyData {
  claimFor: ClaimFor;
  dependentId?: string;
  memberName: string;
  policyNumber: string;
  memberId: string;
  dateOfBirth: string;
}

export interface DiagnosisTreatmentData {
  diagnosisDescription?: string;
  icd10Code?: string;
  treatmentDate?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  providerName?: string;
  admissionReason?: string;
  lengthOfStay?: number;
}

export type ClaimDocumentType =
  | "medical-receipt"
  | "prescription"
  | "discharge-summary"
  | "itemized-bill"
  | "dental-receipt"
  | "treatment-plan";

export interface UploadedClaimDocument {
  id: string;
  documentType: ClaimDocumentType;
  originalName: string;
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
  temporary: boolean;
  uploadedAt: string;
  expiresAt: string;
}

export interface ClaimDocumentsData {
  isMajorDental?: boolean;
  files?: Partial<Record<ClaimDocumentType, UploadedClaimDocument>>;
}

export interface ClaimReviewData {
  confirmedAccuracy?: boolean;
}

export interface ClaimWizardDraft {
  claimType?: ClaimType;
  memberPolicy?: MemberPolicyData;
  diagnosisTreatment?: DiagnosisTreatmentData;
  documents?: ClaimDocumentsData;
  review?: ClaimReviewData;
}

interface ClaimWizardStore {
  currentStep: number;
  draft: ClaimWizardDraft;
  setCurrentStep: (step: number) => void;
  setDraft: (draft: ClaimWizardDraft) => void;
}

export const useClaimWizardStore = create<ClaimWizardStore>()(
  persist(
    (set) => ({
      currentStep: 0,
      draft: { memberPolicy: primaryMemberPolicy },
      setCurrentStep: (step) => set({ currentStep: step }),
      setDraft: (draft) => set({ draft }),
    }),
    {
      name: "claims-intake-wizard",
      partialize: (state) => ({
        currentStep: state.currentStep,
        draft: state.draft,
      }),
    },
  ),
);
