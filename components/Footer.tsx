import React, { useEffect, useState } from "react";

import { Config } from "../lib/getConfig";
import { formatDateTime } from "../lib/formatDate";

interface FooterProps {
  updateTime?: string;
  expire?: number;
  className?: string;
  config?: Config;
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
  const info = updateTime && expire && config? `Atualizado: ${formatDateTime(
      updateTime,
      config.locale,
      config.timeZone
    )} próxima atualização ${formatDateTime(
      expire,
      config.locale,
      config.timeZone
    )}`: ""
  return (
    <footer
      className={`py-2 px-1 text-xs text-right italic ${className}`}
    >{info}</footer>
  );
};

export default Footer;
