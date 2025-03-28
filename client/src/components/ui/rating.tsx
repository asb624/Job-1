import * as React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    { 
      value, 
      max = 5, 
      size = "md", 
      readOnly = true, 
      onChange,
      className,
      ...props 
    },
    ref
  ) => {
    const stars = Array.from({ length: max }, (_, i) => i + 1);
    
    const handleClick = (rating: number) => {
      if (readOnly) return;
      onChange?.(rating);
    };

    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return (
      <div 
        ref={ref} 
        className={cn("flex items-center gap-1", className)} 
        {...props}
      >
        {stars.map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              "cursor-default",
              !readOnly && "cursor-pointer",
              star <= value ? "fill-yellow-500 text-yellow-500" : "fill-transparent text-gray-300"
            )}
            onClick={() => handleClick(star)}
          />
        ))}
      </div>
    );
  }
);

Rating.displayName = "Rating";