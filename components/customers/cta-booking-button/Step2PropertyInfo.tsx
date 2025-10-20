import { StepsProps } from "@/lib/validations/bookng-modal";
import { StepFeedback } from "./StepFeedback";
import { AddressAutocomplete } from "./AddressAutoComplete";
import { CheckCircle, XCircle } from "lucide-react";

export const Step2PropertyInfo = ({
  formData,
  setFormData,
  errors,
}: StepsProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const ServiceAreaFeedback = () => {
    if (formData.isAddressInServiceArea === true) {
      return (
        <div className="mt-2 flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          Great! This address is in our service area.
        </div>
      );
    }
    if (formData.isAddressInServiceArea === false) {
      return (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <XCircle className="h-4 w-4 mr-2" />
          Sorry, this address is outside our service area.
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Property Address
        </label>
        <AddressAutocomplete
          formData={formData}
          setFormData={setFormData}
          errors={errors}
        />
        <ServiceAreaFeedback />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label
            htmlFor="sqft"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Square Footage
          </label>
          <input
            type="text"
            name="sqft"
            id="sqft"
            placeholder="1500"
            defaultValue={formData.sqft?.toString()}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none ${
              errors.sqft ? "border-red-500" : "border-gray-300"
            } focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
          />
        </div>
        <div>
          <label
            htmlFor="bedrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bedrooms
          </label>
          <input
            type="text"
            name="bedrooms"
            id="bedrooms"
            min="1"
            defaultValue={formData.bedrooms?.toString()}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none ${
              errors.bedrooms ? "border-red-500" : "border-gray-300"
            } focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
            required
          />
        </div>
        <div>
          <label
            htmlFor="bathrooms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bathrooms
          </label>
          <input
            type="text"
            name="bathrooms"
            id="bathrooms"
            min="1"
            defaultValue={formData.bathrooms?.toString()}
            onChange={handleChange}
            className={`block w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-md shadow-sm focus:outline-none ${
              errors.bathrooms ? "border-red-500" : "border-gray-300"
            } focus:ring-teal-500 focus:border-teal-500 sm:text-sm`}
            required
          />
        </div>
      </div>
      <StepFeedback
        errors={errors}
        fields={["bathrooms", "bedrooms", "sqft", "address"]}
        message="Fields are required to proceed."
      />
    </div>
  );
};
