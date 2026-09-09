"use client";

import { type ReactNode } from "react";
import { Button, ConfigProvider, Steps } from "antd";
import clsx from "clsx";

export interface ClaimWizardStep {
  key: string;
  title: string;
  description?: string;
}

interface ClaimWizardShellProps {
  steps: ClaimWizardStep[];
  currentStep: number;
  children: ReactNode;
  className?: string;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  isNextLoading?: boolean;
  onBack?: () => void;
  onNext?: () => void | Promise<void>;
  onReset?: () => void;
  onStepChange?: (step: number) => void;
}

export function ClaimWizardShell({
  steps,
  currentStep,
  children,
  className,
  canGoBack = currentStep > 0,
  canGoNext = currentStep < steps.length - 1,
  nextLabel = "Continue",
  backLabel = "Back",
  isNextLoading = false,
  onBack,
  onNext,
  onReset,
  onStepChange,
}: ClaimWizardShellProps) {
  const activeStep = steps[currentStep];
  const stepItems = steps.map((step) => ({
    title: step.title,
    content: step.description,
  }));
  const mobileStepItems = steps.map((step) => ({
    title: step.title,
  }));

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#38a8f4",
          colorInfo: "#38a8f4",
          colorText: "#172033",
          colorTextSecondary: "#65758b",
          colorBorder: "#d7e7f5",
          borderRadius: 8,
          fontFamily: "var(--font-geist-sans), Arial, sans-serif",
        },
        components: {
          Button: {
            controlHeight: 42,
            borderRadius: 8,
            primaryShadow: "none",
          },
          Steps: {
            colorPrimary: "#38a8f4",
            dotSize: 9,
            dotCurrentSize: 10,
          },
        },
      }}
    >
      <div className="container mx-auto flex min-h-svh w-full items-center justify-center bg-white px-4 pt-5 pb-32 sm:px-6 sm:pt-8 lg:pb-24">
        <section className={clsx("flex w-full flex-col", className)}>
          <header className="flex flex-col gap-5 border-b border-sky-100 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sky-500">
                Claims intake
              </p>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                Submit an insurance claim
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                A guided workflow for claim details, incident context, policy
                information, documents, and final review.
              </p>
            </div>
          </header>

          <nav
            aria-label="Claim progress"
            className="border-b border-sky-100 py-4 lg:hidden"
          >
            <div className="max-w-full overflow-x-auto pb-1">
              <Steps
                current={currentStep}
                className="min-w-[640px] [&_.ant-steps-item]:min-w-28! [&_.ant-steps-item-title]:text-xs! [&_.ant-steps-item-title]:font-medium!"
                items={mobileStepItems}
                onChange={onStepChange}
                orientation="horizontal"
                responsive={false}
              />
            </div>
          </nav>

          <div className="grid flex-1 gap-6 md:gap-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-9">
            <aside className="hidden border-r border-sky-100 pt-6 pr-8 lg:block">
              <Steps
                current={currentStep}
                className="[&_.ant-steps-item]:pb-5! [&_.ant-steps-item-content]:max-w-none! [&_.ant-steps-item-content]:text-sm! [&_.ant-steps-item-title]:font-medium!"
                orientation="vertical"
                items={stepItems}
                onChange={onStepChange}
              />
            </aside>

            <main className="flex min-w-0 flex-col pt-6">
              <div>
                <p className="text-sm font-medium text-sky-500">
                  {activeStep?.description}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                  {activeStep?.title}
                </h2>
              </div>

              <div
                id="claim-step-panel"
                className="min-h-[320px] flex-1 rounded-lg border border-sky-100 bg-white p-4 shadow-sm shadow-sky-100/70 sm:min-h-[360px] sm:p-6 lg:p-8"
              >
                {children}
              </div>
            </main>
          </div>
        </section>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-sky-100 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.07)] backdrop-blur supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="container mx-auto flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className="h-11 w-full sm:w-auto sm:min-w-28"
            disabled={!canGoBack}
            onClick={onBack}
          >
            {backLabel}
          </Button>
          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
            {onReset && (
              <Button
                className="h-11 w-full sm:w-auto sm:min-w-28"
                onClick={onReset}
                danger
                variant="outlined"
              >
                Reset form
              </Button>
            )}
            <Button
              className="h-11 w-full sm:w-auto sm:min-w-32"
              disabled={!canGoNext}
              loading={isNextLoading}
              type="primary"
              onClick={onNext}
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      </footer>
    </ConfigProvider>
  );
}
