import type { RemixLinkProps } from "@remix-run/react/dist/components";
import { Link as RemixLink } from "@remix-run/react";

interface LinkProps extends RemixLinkProps {
  disabled?: boolean;
  button?: boolean;
}

export default function Link({
  button = true,
  className,
  disabled,
  ...props
}: LinkProps) {
  return (
    <RemixLink
      aria-disabled={disabled}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        backgroundColor: button && disabled ? "#ccccccae" : undefined,
      }}
      className={`${
        button &&
        "flex items-center justify-center rounded-lg bg-blue-500 px-2.5 py-2 font-medium text-white hover:bg-blue-600"
      } ${className}`}
      {...props}
    />
  );
}
