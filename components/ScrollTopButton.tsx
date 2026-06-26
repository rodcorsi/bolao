import React, { useEffect, useState } from "react";

const ScrollTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className="fixed right-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition hover:bg-slate-700 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 4.293a1 1 0 0 1 .707.293l5 5a1 1 0 1 1-1.414 1.414L11 7.707V15a1 1 0 1 1-2 0V7.707L5.707 11a1 1 0 0 1-1.414-1.414l5-5A1 1 0 0 1 10 4.293Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export default ScrollTopButton;
