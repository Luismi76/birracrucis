"use client";

import BeerLoader from "@/components/ui/BeerLoader";

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-50">
            <BeerLoader />
        </div>
    );
}
