import React from "react";
import { formatDateTime } from "../lib/formatDate";

interface FooterProps {
  updateTime: string;
  expire: number;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  updateTime,
  expire,
  className = "",
}) => {
  return (
    <footer
      className={`py-2 px-1 text-xs text-right italic ${className}`}
    >{`Atualizado: ${formatDateTime(
      updateTime
    )} próxima atualização ${formatDateTime(expire)}`}</footer>
  );
};

export default Footer;
