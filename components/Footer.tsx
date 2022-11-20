import React from "react";
import { formatDateTime } from "../lib/formatDate";

interface FooterProps {
  updateTime: string;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ updateTime, className = "" }) => {
  return (
    <footer
      className={`py-2 px-1 text-xs text-right italic ${className}`}
    >{`Atualizado: ${formatDateTime(updateTime)}`}</footer>
  );
};

export default Footer;
