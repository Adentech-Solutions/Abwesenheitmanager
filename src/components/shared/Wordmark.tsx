import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark";
}

export const Wordmark = ({ className = "", size = "md", theme = "light" }: WordmarkProps) => {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };
  
  return (
    <span className={cn("font-medium tracking-tight whitespace-nowrap", sizes[size], className)}>
      <span className={cn(theme === "dark" ? "text-white" : "text-gray-900")}>freye</span>
      <span className={cn(theme === "dark" ? "text-primary-400" : "text-primary-600")}>tag</span>
    </span>
  );
};

export default Wordmark;
