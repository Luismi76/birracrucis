"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
    rating: number; // 0-5
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
    count?: number;
};

export default function StarRating({
    rating,
    onRatingChange,
    readOnly = false,
    size = "md",
    showCount = false,
    count = 0
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const sizes = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    const handleMouseEnter = (index: number) => {
        if (!readOnly) setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (!readOnly) setHoverRating(null);
    };

    const handleClick = (index: number) => {
        if (!readOnly && onRatingChange) {
            onRatingChange(index);
        }
    };

    const displayRating = hoverRating !== null ? hoverRating : rating;

    return (
        <div className="flex items-center gap-1">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((index) => (
                    <button
                        key={index}
                        type="button"
                        disabled={readOnly}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(index)}
                        className={`
                            ${readOnly ? "cursor-default" : "cursor-pointer transition-transform hover:scale-110"}
                            focus:outline-none p-0.5
                        `}
                    >
                        <Star
                            className={`
                                ${sizes[size]} 
                                ${index <= displayRating
                                    ? "fill-amber-400 text-amber-500"
                                    : "fill-slate-100 text-slate-300"
                                }
                                transition-colors
                            `}
                        />
                    </button>
                ))}
            </div>
            {showCount && (
                <span className="text-xs text-slate-400 ml-1 font-medium">({count})</span>
            )}
        </div>
    );
}
