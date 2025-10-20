import { StepsProps } from "@/lib/validations/bookng-modal";
// import { SubscriptionCard } from "./SubscriptionCard";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { StepFeedback } from "./StepFeedback";

const LAUNCH_DATE = new Date('2025-10-22');
const sevenDaysFromNow = addDays(new Date(), 7);

const firstAvailableDay = sevenDaysFromNow < LAUNCH_DATE 
  ? LAUNCH_DATE 
  : sevenDaysFromNow;

// const firstAvailableDay = addDays(new Date(), 7);

export const Step5Subscription = ({ formData, setFormData, errors }: StepsProps) => {
  // const handleTermSelect = (months: number) =>
  //   setFormData((prev) => ({ ...prev, subscriptionMonths: months }));

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, firstCleanDate: date }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        {/* <h3 className="text-lg font-medium text-gray-900">
          Select Subscription Term
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Choose your desired subscription length.
        </p>
        <div className="mt-4 flex flex-wrap justify-between">
          {[1, 2, 3, 4, 5, 6].map((m) => (
            <SubscriptionCard
              key={m}
              months={m}
              selected={formData.subscriptionMonths === m}
              onSelect={handleTermSelect}
            />
          ))}
        </div> */}
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Select First Clean Date</h3>
        <p className="mt-1 text-sm text-gray-600">
          To ensure cleaner availability, there is a mandatory 7-day buffer before your first turnover can be scheduled. October 21st is our first available date. We&apos;ll contact you with a welcome call.
        </p>
        <div className="mt-4 flex flex-col gap-8 items-start">
            <DayPicker
              mode="single"
              selected={formData.firstCleanDate}
              onSelect={handleDateSelect}
              disabled={{ before: firstAvailableDay }}
              className="border rounded-md p-2 text-gray-800"
              styles={{
                head_cell: { width: '40px' },
                day: { width: '40px', height: '40px' },
              }}
            />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-700">Selected Date:</h4>
              {formData.firstCleanDate ? (
                <div className="mt-2 flex items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                    <CalendarIcon className="h-5 w-5 text-teal-600 mr-3"/>
                    <span className="font-medium text-gray-800">{format(formData.firstCleanDate, 'PPPP')}</span>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Please select a date from the calendar.</p>
              )}
            </div>
        </div>
      </div>
      <StepFeedback 
        errors={errors}
        fields={['firstCleanDate']}
      />
    </div>
  );
};
