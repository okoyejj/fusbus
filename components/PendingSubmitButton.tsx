"use client";

import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  children: string;
  pendingLabel: string;
  className?: string;
  name?: string;
  value?: string;
};

export function PendingSubmitButton({ children, pendingLabel, className = "btn btn-primary", name, value }: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} name={name} value={value} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
