import { getDocumentRequirements } from "../data/claim-document-requirements";
import {
  type ClaimDocumentType,
  type ClaimWizardDraft,
  type UploadedClaimDocument,
} from "../stores/claim-wizard-store";

function getApplicableDocuments(draft: ClaimWizardDraft) {
  const uploadedFiles = draft.documents?.files;

  if (!draft.claimType || !uploadedFiles) {
    return undefined;
  }

  const visibleDocumentTypes = new Set(
    getDocumentRequirements(
      draft.claimType,
      Boolean(draft.documents?.isMajorDental),
    ).map((requirement) => requirement.type),
  );

  return Object.entries(uploadedFiles).reduce<
    Partial<Record<ClaimDocumentType, UploadedClaimDocument>>
  >((nextFiles, [documentType, uploadedFile]) => {
    if (
      uploadedFile &&
      visibleDocumentTypes.has(documentType as ClaimDocumentType)
    ) {
      nextFiles[documentType as ClaimDocumentType] = uploadedFile;
    }

    return nextFiles;
  }, {});
}

export function sanitizeClaimDraft(draft: ClaimWizardDraft): ClaimWizardDraft {
  const sanitized: ClaimWizardDraft = {
    ...draft,
    memberPolicy: draft.memberPolicy
      ? {
          ...draft.memberPolicy,
          dependentId:
            draft.memberPolicy.claimFor === "dependent"
              ? draft.memberPolicy.dependentId
              : undefined,
        }
      : undefined,
  };

  if (draft.diagnosisTreatment) {
    sanitized.diagnosisTreatment =
      draft.claimType === "inpatient"
        ? {
            ...draft.diagnosisTreatment,
            treatmentDate: undefined,
          }
        : {
            ...draft.diagnosisTreatment,
            treatmentStartDate: undefined,
            treatmentEndDate: undefined,
            admissionReason: undefined,
            lengthOfStay: undefined,
          };
  }

  const applicableFiles = getApplicableDocuments(draft);

  sanitized.documents = draft.documents
    ? {
        isMajorDental:
          draft.claimType === "dental"
            ? draft.documents.isMajorDental
            : undefined,
        files:
          applicableFiles && Object.keys(applicableFiles).length > 0
            ? applicableFiles
            : undefined,
      }
    : undefined;

  return sanitized;
}
