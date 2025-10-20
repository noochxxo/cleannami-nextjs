import React, { useState } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { serviceAreaPolygons } from '@/lib/google-maps/serviceArea/index.ts';
import { SignupFormData } from '@/lib/validations/bookng-modal';

interface Props {
  formData: SignupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  errors: Record<string, string[] | undefined>;
}

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

export const AddressAutocomplete = ({ formData, setFormData, errors }: Props) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onAutocompleteLoad = (ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || '';
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();

      let isAddressInServiceArea = false;
      if (lat && lng && window.google && window.google.maps.geometry) {
        const selectedLocation = new google.maps.LatLng(lat, lng);

        for (const polygonCoords of serviceAreaPolygons) {
          const polygon = new google.maps.Polygon({ paths: polygonCoords });
          if (google.maps.geometry.poly.containsLocation(selectedLocation, polygon)) {
            isAddressInServiceArea = true;
            break;
          }
        }
      }

      setFormData(prev => ({
        ...prev,
        address,
        isAddressInServiceArea,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      address: e.target.value,
      isAddressInServiceArea: undefined,
    }));
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <Autocomplete
      onLoad={onAutocompleteLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['address'],
        componentRestrictions: { country: ['us', 'ca'] },
      }}
    >
      <input
        type="text"
        placeholder="Enter property address"
        value={formData.address || ''}
        onChange={handleChange}
        className={`block w-full px-3 py-2 text-gray-800 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
          errors.address ? 'border-red-500' : 'border-gray-300'
        } focus:ring-teal-500 focus:border-teal-500`}
        required
      />
    </Autocomplete>
  );
};

