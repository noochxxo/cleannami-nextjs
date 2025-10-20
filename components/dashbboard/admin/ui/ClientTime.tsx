'use client'

import { useEffect, useState } from "react";

export const ClientTime = ({
  dateString,
}: {
  dateString: string | null | undefined;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !dateString) {
    return <span>N/A</span>; 
  }

  const time = new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return <span>{time}</span>;
};