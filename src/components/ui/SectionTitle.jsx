import { cn } from "../../lib/utils";

export default function SectionTitle({ children, className }) {
  return (
    <h2 className={cn("text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2", className)}>
      {children}
    </h2>
  );
}
