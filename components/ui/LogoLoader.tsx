"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoLoaderProps {
    src: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function LogoLoader({
    src,
    className,
    width = 300,
    height = 450,
}: LogoLoaderProps) {
    return (
        <div
            className={cn("relative flex flex-col items-center justify-center", className)}
            style={{ width, height }}
        >
            {/* 
         Cruzcampo-style Caña Glass Shape:
         - Taller aspect ratio (~2:3)
         - Slightly tapered (simulated with perspective or just slightly narrower bottom visual weight)
         - Bottom corners are rounded but the base is fairly flat.
      */}
            <div className="relative w-full h-full transform-gpu" style={{ perspective: '1000px' }}>
                {/* Glass Container 
             Using rotateX with perspective to simulate the tapered look (wider top, narrower bottom)
         */}
                <div
                    className="relative w-full h-full border-[6px] border-white/60 border-t-0 rounded-b-[3.5rem] overflow-hidden backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.2)]"
                    style={{
                        // Slight 3D rotation to make the top look wider than the bottom
                        transform: 'rotateX(5deg)',
                        transformOrigin: 'bottom center',
                    }}
                >
                    {/* Liquid Animation - Golden Beer Color (Cruzcampo style) */}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-yellow-500 via-yellow-400 to-amber-300 animate-[fillGlass_3s_ease-out_forwards]">
                        {/* Bubbles */}
                        <div className="absolute bottom-6 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-[bubble_2s_linear_infinite]" />
                        <div className="absolute bottom-12 right-1/3 w-1.5 h-1.5 bg-white/40 rounded-full animate-[bubble_3s_linear_infinite_0.5s]" />
                        <div className="absolute bottom-8 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-[bubble_4s_linear_infinite_1s]" />
                        <div className="absolute bottom-24 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-[bubble_2.5s_linear_infinite_1.5s]" />

                        {/* Foam Head - Thicker, creamier */}
                        <div className="absolute top-0 w-full h-12 bg-gradient-to-b from-white to-white/90 blur-[2px] -translate-y-6" />
                    </div>

                    {/* Logo floating inside (Counter-rotate to keep it flat) */}
                    <div
                        className="absolute inset-0 flex items-center justify-center z-10 p-6"
                        style={{ transform: 'rotateX(-5deg)' }}
                    >
                        <Image
                            src={src}
                            alt="Loading..."
                            width={width * 0.75}
                            height={height * 0.75}
                            className="object-contain drop-shadow-2xl animate-bounce-slow opacity-90 mix-blend-multiply"
                            priority
                        />
                    </div>

                    {/* Glass Highlights - Enhanced for "realism" */}
                    <div className="absolute top-0 right-2 w-full h-full bg-gradient-to-l from-white/30 via-transparent to-transparent pointer-events-none rounded-b-[3.5rem]" />
                    <div className="absolute top-4 left-4 w-3 h-3/4 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-[2px]" />
                </div>
            </div>
        </div>
    );
}
