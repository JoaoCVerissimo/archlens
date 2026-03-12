import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "info" | "success" | "warning" | "error" | "default";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
