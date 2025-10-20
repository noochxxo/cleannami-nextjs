import { StepsProps } from "@/lib/validations/bookng-modal";
import { FormField } from "./FormField";
import { StepFeedback } from "./StepFeedback";

export const Step1CustomerInfo = ({
  formData,
  setFormData,
  errors,
}: StepsProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <FormField
        label="Full Name"
        name="name"
        type="text"
        placeholder="Jane Doe"
        value={formData.name || ""}
        onChange={handleChange}
        error={!!errors.name}
      />
      <FormField
        label="Email Address"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={formData.email || ""}
        onChange={handleChange}
        error={!!errors.email}
      />
      <FormField
        label="Confirm Email Address"
        name="emailConfirm"
        type="email"
        placeholder="you@example.com"
        value={formData.emailConfirm || ""}
        onChange={handleChange}
        error={!!errors.emailConfirm}
      />
      <FormField
        label="Phone Number"
        name="phoneNumber"
        type="tel"
        placeholder="(555) 123-4567"
        value={formData.phoneNumber || ""}
        onChange={handleChange}
        error={!!errors.phoneNumber}
      />

      <StepFeedback
        errors={errors}
        fields={["name", "email", "emailConfirm", "phoneNumber"]}
      />
    </div>
  );
};
