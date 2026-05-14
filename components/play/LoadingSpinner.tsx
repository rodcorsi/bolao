import React from "react";

const LoadingSpinner: React.FC = () => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    aria-hidden="true"
  />
);

export default LoadingSpinner;
