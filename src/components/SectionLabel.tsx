import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  children: React.ReactNode;
  htmlFor?: string;
}

// The small uppercase heading over each part of the form, with its icon.
export function SectionLabel({ icon: Icon, children, htmlFor }: Props) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-[7px] mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-faint"
    >
      <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
      {children}
    </label>
  );
}
