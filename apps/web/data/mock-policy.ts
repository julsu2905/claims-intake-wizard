import { type MemberPolicyData } from "../stores/claim-wizard-store";

export interface DependentOption {
  id: string;
  relationship: string;
  memberName: string;
  memberId: string;
  dateOfBirth: string;
}

export const primaryMemberPolicy: MemberPolicyData = {
  claimFor: "self",
  memberName: "Avery Johnson",
  policyNumber: "POL-482910-HEALTH",
  memberId: "MBR-104829",
  dateOfBirth: "1986-04-18",
};

export const dependentOptions: DependentOption[] = [
  {
    id: "dep-001",
    relationship: "Spouse",
    memberName: "Morgan Johnson",
    memberId: "MBR-104829-01",
    dateOfBirth: "1988-09-07",
  },
  {
    id: "dep-002",
    relationship: "Child",
    memberName: "Riley Johnson",
    memberId: "MBR-104829-02",
    dateOfBirth: "2016-02-22",
  },
  {
    id: "dep-003",
    relationship: "Child",
    memberName: "Taylor Johnson",
    memberId: "MBR-104829-03",
    dateOfBirth: "2019-11-14",
  },
];

export function getDependentPolicy(
  dependentId: string,
): MemberPolicyData | undefined {
  const dependent = dependentOptions.find((option) => option.id === dependentId);

  if (!dependent) {
    return undefined;
  }

  return {
    claimFor: "dependent",
    dependentId: dependent.id,
    memberName: dependent.memberName,
    policyNumber: primaryMemberPolicy.policyNumber,
    memberId: dependent.memberId,
    dateOfBirth: dependent.dateOfBirth,
  };
}
