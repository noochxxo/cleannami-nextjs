"use client";
import {
  PriceDetails,
  SignupFormData,
  signupFormSchema,
} from "@/lib/validations/bookng-modal";
import React, { useState, useEffect, useMemo } from "react";
import { Step1CustomerInfo } from "./Step1CustomerInfo";
import { Step2PropertyInfo } from "./Step2PropertyInfo";
import { Step3Checklist } from "./Step3Checklist";
import { Step4Addons } from "./Step4Addons";
import { Step5Subscription } from "./Step5Subscription";
import { Step6Calendar } from "./Step6Calendar";
import { Step7Payment } from "./Step7Payment";
import { Step8Confirmation } from "./Step8Confirmation";
import { ModalLayout } from "./ModalLayout";
import { ProgressBar } from "./ProgressBar";
import { PriceSummary } from "./PriceSummary";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";
import { cn } from "@/lib/utils";
import { getLivePrice } from "@/lib/actions/clientSidePricing.actions";

const stepFields: Record<number, string[]> = {
  1: ["name", "email", "emailConfirm", "phoneNumber"],
  2: ["address", "bedrooms","sqft", "bathrooms", "isAddressInServiceArea"],
  // 3: ["checklistFile", "useDefaultChecklist"],
  5: ["firstCleanDate"],
  6: ["iCalUrl"],
};

const stepTitles = [
  "Customer Info",
  "Property Details",
  "Cleaning Checklist",
  "Service Add-ons",
  "Subscription Term",
  "Calendar Sync",
  "Payment",
  "Confirmation",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 8;

export const SignupForm = ({ isOpen, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
  name: "",
  email: "",
  emailConfirm: "",
  phoneNumber: "",
  address: "",
  sqft: 900,
  bedrooms: 2,
  bathrooms: 1,
  checklistFile: undefined,
  useDefaultChecklist: false,
  laundryService: "none",
  laundryLoads: 1,
  hasHotTub: false,
  hotTubService: false,
  hotTubDrain: false,
  hotTubDrainCadence: undefined,
  subscriptionMonths: 6,
  iCalUrl: "",
  isAddressInServiceArea: false,
  // @ts-expect-error: null is needed to prevent calendar from proceeding on invalid options
  firstCleanDate: null,
});
  // const [formData, setFormData] = useState<SignupFormData>({
  //   name: "",
  //   email: "",
  //   emailConfirm: "",
  //   phoneNumber: "",
  //   address: "",
  //   sqft: 900,
  //   bedrooms: 2,
  //   bathrooms: 1,
  //   checklistFile: undefined,
  //   useDefaultChecklist: false,
  //   laundryService: "none",
  //   laundryLoads: 1,
  //   hasHotTub: false,
  //   hotTubService: "none",
  //   hotTubDrain: false,
  //   hotTubDrainCadence: undefined,
  //   subscriptionMonths: 6,
  //   iCalUrl: "",
  //   // @ts-expect-error: null is needed to prevent calendar from proceeding on invlid options
  //   firstCleanDate: null,
  // });
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );


  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
  const fetchPrice = async () => {
    // The specific check for bedrooms and bathrooms has been removed.
    const details = await getLivePrice(formData);
    setPriceDetails(details);
  };

  const timerId = setTimeout(() => {
    fetchPrice();
  }, 500);

  return () => {
    clearTimeout(timerId);
  };

}, [JSON.stringify(formData)]); 

  // const validateStep = (step: number) => {
    
  //   const fieldsToValidate = stepFields[step];
  //   if (!fieldsToValidate) {
  //     setErrors({});
  //     return true;
  //   }

  //   const result = signupFormSchema.partial().safeParse(formData);
  //   if (result.success) {
  //     setErrors({});
  //     return true;
  //   }

  //   // const fieldErrors = result.error.flatten().fieldErrors;
  //   const fieldErrors = result.error.flatten().fieldErrors;
  //   const currentStepErrors: Record<string, string[] | undefined> = {};
  //   let hasErrorOnStep = false;
  //   fieldsToValidate.forEach((field) => {
  //     if (fieldErrors[field as keyof SignupFormData]) {
  //       currentStepErrors[field] = fieldErrors[field as keyof SignupFormData];
  //       hasErrorOnStep = true;
  //     }
  //   });
  //   setErrors(currentStepErrors);
  //   return !hasErrorOnStep;
  // };

  const validateStep = (step: number) => {
  // --- Step 3 Special Validation ---
  if (step === 3) {
    const useDefault = formData.useDefaultChecklist;
    const hasFile = formData.checklistFile && formData.checklistFile.length > 0;

    // If one of the options is chosen, the step is valid.
    if (useDefault || hasFile) {
      setErrors({});
      return true;
    }

    // If neither is chosen, show an error and fail validation.
    setErrors({
      checklistFile: [
        "Please either upload a checklist or select the default option.",
      ],
    });
    return false;
  }

  // --- Default Zod Validation for all other steps ---
  const fieldsToValidate = stepFields[step];
  if (!fieldsToValidate) {
    setErrors({});
    return true;
  }

  const result = signupFormSchema.partial().safeParse(formData);
  if (result.success) {
    setErrors({});
    return true;
  }

  const fieldErrors = result.error.flatten().fieldErrors;
  const currentStepErrors: Record<string, string[] | undefined> = {};
  let hasErrorOnStep = false;
  fieldsToValidate.forEach((field) => {
    if (fieldErrors[field as keyof SignupFormData]) {
      currentStepErrors[field] = fieldErrors[field as keyof SignupFormData];
      hasErrorOnStep = true;
    }
  });
  setErrors(currentStepErrors);
  return !hasErrorOnStep;
};

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };
  const prevStep = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSaving(true);
    setSaveError(null);
    console.log("Payment successful! Saving data to database...");

    const result = await completeOnboarding(formData, paymentIntentId);

    setIsSaving(false);

    if (result.success) {
      setCurrentStep(TOTAL_STEPS);
    } else {
      const errorMessage = `Your payment was successful, but there was an issue finalizing your subscription. 
                Our team has been notified. For your records, your transaction ID is: ${paymentIntentId}. 
                Please contact support if you have any questions.`;
      setSaveError(errorMessage);
    }
  };

  const renderStep = () => {
    const props = { formData, setFormData, errors };
    switch (currentStep) {
      case 1:
        return <Step1CustomerInfo {...props} />;
      case 2:
        return <Step2PropertyInfo {...props} />;
      case 3:
        return <Step3Checklist {...props} />;
      case 4:
        return <Step4Addons {...props} />;
      case 5:
        return <Step5Subscription {...props} />;
      case 6:
        return <Step6Calendar {...props} />;

      case 7:
        return (
          <div>
            <Step7Payment
              priceDetails={priceDetails}
              formData={formData}
              onPaymentSuccess={handlePaymentSuccess}
            />
            {isSaving && (
              <p className="text-center mt-4 text-sm text-gray-500 animate-pulse">
                Finalizing your subscription...
              </p>
            )}
            {saveError && (
              <p className="text-center mt-4 text-sm text-red-600">
                {saveError}
              </p>
            )}
          </div>
        );
      case 8:
        return <Step8Confirmation />;
      default:
        return null;
    }
  };

  const isConfirmation = currentStep === TOTAL_STEPS;
  const showPriceSummary = currentStep >= 2 && currentStep < TOTAL_STEPS;

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={stepTitles[currentStep - 1]}
      showPriceSummary={showPriceSummary}
      priceDetails={priceDetails}
    >
      {!isConfirmation && (
        <div className="mb-6">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS - 1} />
        </div>
      )}

      {showPriceSummary && (
        <div className="md:hidden mb-6">
          <PriceSummary priceDetails={priceDetails} />
        </div>
      )}

      <div>
        <div className="min-h-[350px]">{renderStep()}</div>
        
          <div className="mt-8 pt-5 border-t">
            <div className="flex justify-between">
              {/* Not visibl for some reasone */}
                <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn("py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand/60", currentStep === 1 ? 'invisible': 'visible')}
              >
                Back
              </button>
              

              {/* NEXT BUTTON: Only visible on steps before payment */}
              {!isConfirmation && currentStep < 7 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand/60"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        
      </div>
    </ModalLayout>
  );
};