import React, { useState, useEffect } from "react";
import { formatDateTime } from "../lib/formatDate";
import { Config } from "../lib/getConfig";

interface FooterProps {
  updateTime: string;
  expire: number;
  className?: string;
  config: Config;
}

const Footer: React.FC<FooterProps> = ({
  updateTime,
  expire,
  className = "",
  config,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className={`py-2 px-1 text-xs text-right italic ${className}`}>
        &nbsp;
      </footer>
    );
  }

  return (
    <footer
      className={`py-2 px-1 text-xs text-right italic ${className}`}
    >{`Atualizado: ${formatDateTime(
      updateTime,
      config.locale,
      config.timeZone
    )} próxima atualização ${formatDateTime(
      expire,
      config.locale,
      config.timeZone
    )}`}</footer>
  );
};

export default Footer;
