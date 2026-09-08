import {
  type ClaimDocumentType,
  type ClaimType,
} from "../stores/claim-wizard-store";

export interface DocumentRequirement {
  type: ClaimDocumentType;
  title: string;
  description: string;
  required: boolean;
}

export const documentLabels: Record<ClaimDocumentType, string> = {
  "medical-receipt": "Medical receipt",
  prescription: "Prescription",
  "discharge-summary": "Discharge summary",
  "itemized-bill": "Itemized bill",
  "dental-receipt": "Dental receipt",
  "treatment-plan": "Treatment plan",
};

export const requirementsByClaimType: Record<ClaimType, DocumentRequirement[]> =
  {
    outpatient: [
      {
        type: "medical-receipt",
        title: documentLabels["medical-receipt"],
        description: "Clinic or pharmacy receipt showing amount paid.",
        required: true,
      },
      {
        type: "prescription",
        title: documentLabels.prescription,
        description: "Prescription or medication order when available.",
        required: false,
      },
    ],
    inpatient: [
      {
        type: "discharge-summary",
        title: documentLabels["discharge-summary"],
        description: "Official discharge summary from the hospital.",
        required: true,
      },
      {
        type: "itemized-bill",
        title: documentLabels["itemized-bill"],
        description: "Line-by-line invoice for inpatient services.",
        required: true,
      },
      {
        type: "medical-receipt",
        title: documentLabels["medical-receipt"],
        description: "Payment receipt for hospital charges.",
        required: true,
      },
    ],
    dental: [
      {
        type: "dental-receipt",
        title: documentLabels["dental-receipt"],
        description: "Receipt or invoice from the dental provider.",
        required: true,
      },
      {
        type: "treatment-plan",
        title: documentLabels["treatment-plan"],
        description: "Required for major dental work such as surgery or crowns.",
        required: false,
      },
    ],
  };

export function getDocumentRequirements(
  claimType: ClaimType | undefined,
  isMajorDental: boolean,
) {
  if (!claimType) {
    return [];
  }

  if (claimType !== "dental") {
    return requirementsByClaimType[claimType];
  }

  return requirementsByClaimType.dental.map((requirement) =>
    requirement.type === "treatment-plan"
      ? {
          ...requirement,
          required: isMajorDental,
        }
      : requirement,
  );
}

export function getRequiredDocumentTypes(
  claimType: ClaimType | undefined,
  isMajorDental: boolean,
) {
  return getDocumentRequirements(claimType, isMajorDental)
    .filter((requirement) => requirement.required)
    .map((requirement) => requirement.type);
}
