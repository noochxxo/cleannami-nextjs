"use client";
import React, { useState } from "react";
import { SignupForm } from "./SignupForm";

export const SignupModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-brand text-white font-semibold rounded-lg shadow-md hover:bg-brand/60 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
      >
        Start Your Subscription
      </button>

      <SignupForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
