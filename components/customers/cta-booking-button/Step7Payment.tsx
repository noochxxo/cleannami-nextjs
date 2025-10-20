import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PriceDetails, SignupFormData } from '@/lib/validations/bookng-modal';
import { createValidatedPaymentIntent } from '@/lib/actions/payment.actions';
import { CheckoutForm } from './CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Props {
  priceDetails: PriceDetails | null;
  formData: SignupFormData;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

export const Step7Payment = ({ priceDetails, formData, onPaymentSuccess }: Props) => {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!priceDetails || priceDetails.totalPerClean <= 0) return;

    const amountInCents = Math.round(priceDetails.totalPerClean * 100);

    // Call the Server Action with form data for server-side validation
    createValidatedPaymentIntent(formData, amountInCents)
      .then(result => {
        if (result.error) {
          setError(result.error);
        } else if (result.clientSecret) {
          setClientSecret(result.clientSecret);
          setError(null);
        }
      });
  }, [priceDetails, formData]);

  const appearance = { theme: 'stripe' as const, variables: { colorPrimary: '#14b8a6' } };
  const options: StripeElementsOptions = { clientSecret, appearance };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Secure Payment & Activation</h3>
        <p className="mt-1 text-sm text-gray-600">Enter your payment details to prepay for your first clean and activate your subscription.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}

      {clientSecret && !error ? (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm onPaymentSuccess={onPaymentSuccess} />
        </Elements>
      ) : (
        <div className="h-48 flex items-center justify-center">
          {!error && <div className="spinner" />}
        </div>
      )}

      <style jsx>{`
        /* Spinner styles remain the same */
      `}</style>
    </div>
  );
};

