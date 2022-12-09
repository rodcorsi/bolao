import Link from "next/link";
import React from "react";

interface ExternalLinkProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
}

const ExternalLink: React.FC<ExternalLinkProps> = ({
  className = "",
  children,
  href,
}) => {
  return (
    <Link
      href={href}
      target="_blank"
      className={"text-blue-600 hover:underline block " + className}
    >
      {children}
      <span className="pl-1">🡕</span>
    </Link>
  );
};

export default ExternalLink;
