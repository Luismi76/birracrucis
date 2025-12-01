"use client";

type AutoCheckinNotificationProps = {
    message: string | null;
};

export default function AutoCheckinNotification({ message }: AutoCheckinNotificationProps) {
    if (!message) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
            <div className="bg-green-500 text-white rounded-xl p-4 shadow-lg flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                    <p className="font-bold">Check-in automatico</p>
                    <p className="text-sm text-green-100">{message}</p>
                </div>
            </div>
        </div>
    );
}
