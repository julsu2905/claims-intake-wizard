"use client";

import { Form, Input, Radio, Select, type FormInstance } from "antd";
import {
  dependentOptions,
  getDependentPolicy,
  primaryMemberPolicy,
} from "../../data/mock-policy";
import {
  type ClaimFor,
  type ClaimWizardDraft,
} from "../../stores/claim-wizard-store";

interface MemberPolicyStepProps {
  form: FormInstance<ClaimWizardDraft>;
  onDraftChange: () => void;
}

export function MemberPolicyStep({ form, onDraftChange }: MemberPolicyStepProps) {
  const claimFor = Form.useWatch(["memberPolicy", "claimFor"], form);
  const values = Form.useWatch("memberPolicy", form) ?? primaryMemberPolicy;
  const isDependentClaim = claimFor === "dependent";

  const updatePolicy = (changedValues: Partial<typeof primaryMemberPolicy>) => {
    form.setFieldValue("memberPolicy", {
      ...values,
      ...changedValues,
    });
    onDraftChange();
  };

  const handleClaimForChange = (claimFor: ClaimFor) => {
    if (claimFor === "self") {
      form.setFieldValue("memberPolicy", {
        ...primaryMemberPolicy,
        claimFor,
        dependentId: undefined,
      });
      onDraftChange();
      return;
    }

    const firstDependentId = dependentOptions[0]?.id;
    const firstDependentPolicy = firstDependentId
      ? getDependentPolicy(firstDependentId)
      : undefined;

    form.setFieldValue("memberPolicy", {
      ...(firstDependentPolicy ?? values),
      claimFor,
    });
    onDraftChange();
  };

  const handleDependentChange = (dependentId: string) => {
    const dependentPolicy = getDependentPolicy(dependentId);

    if (dependentPolicy) {
      form.setFieldValue("memberPolicy", dependentPolicy);
      onDraftChange();
    }
  };

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        Step 2 - Member & Policy Information
      </legend>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        We pre-filled the policy profile from mock eligibility data. Review the
        details and update anything that does not match the claimant.
      </p>

      <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50 px-4 py-4">
        <Form.Item
          className="mb-0"
          label="Who is this claim for?"
          name={["memberPolicy", "claimFor"]}
        >
          <Radio.Group
            className="grid w-full gap-3 sm:grid-cols-2"
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: "Primary member", value: "self" },
              { label: "Dependent", value: "dependent" },
            ]}
            onChange={(event) =>
              handleClaimForChange(event.target.value as ClaimFor)
            }
          />
        </Form.Item>
      </div>

      {isDependentClaim ? (
        <Form.Item
          className="mt-6"
          label="Dependent"
          name={["memberPolicy", "dependentId"]}
          rules={[
            {
              required: true,
              message: "Select the dependent receiving care.",
            },
          ]}
        >
          <Select
            options={dependentOptions.map((dependent) => ({
              label: `${dependent.memberName} - ${dependent.relationship}`,
              value: dependent.id,
            }))}
            placeholder="Select dependent"
            onChange={handleDependentChange}
          />
        </Form.Item>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Form.Item
          label="Member name"
          name={["memberPolicy", "memberName"]}
          rules={[{ required: true, message: "Enter the member name." }]}
        >
          <Input placeholder="Member name" />
        </Form.Item>

        <Form.Item
          label="Policy number"
          name={["memberPolicy", "policyNumber"]}
          rules={[{ required: true, message: "Enter the policy number." }]}
        >
          <Input placeholder="Policy number" />
        </Form.Item>

        <Form.Item
          label="Member ID"
          name={["memberPolicy", "memberId"]}
          rules={[{ required: true, message: "Enter the member ID." }]}
        >
          <Input placeholder="Member ID" />
        </Form.Item>

        <Form.Item
          label="Date of birth"
          name={["memberPolicy", "dateOfBirth"]}
          rules={[
            {
              required: true,
              message: "Enter the member date of birth.",
            },
          ]}
        >
          <Input type="date" />
        </Form.Item>
      </div>
    </fieldset>
  );
}
