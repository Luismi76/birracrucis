"use client";

import { useState } from "react";

type RouteStop = {
  id: string;
  name: string;
  address: string;
  arrivalTime?: string;
  departureTime?: string;
};

type AddToCalendarProps = {
  routeName: string;
  routeDate: string;
  startTime: string;
  stops: RouteStop[];
};

export default function AddToCalendar({
  routeName,
  routeDate,
  startTime,
  stops,
}: AddToCalendarProps) {
  const [showOptions, setShowOptions] = useState(false);

  // Calculate end time based on last stop
  const lastStop = stops[stops.length - 1];
  const endTime = lastStop?.departureTime || startTime;

  // Format date for different calendar formats
  const formatDateForGoogle = (date: string, time: string) => {
    const d = new Date(`${date.split("T")[0]}T${time}`);
    return d.toISOString().replace(/-|:|\.\d{3}/g, "");
  };

  const formatDateForICS = (date: string, time: string) => {
    const d = new Date(`${date.split("T")[0]}T${time}`);
    return d.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1);
  };

  // Generate event description
  const generateDescription = () => {
    let desc = `Ruta de bares: ${routeName}\n\n`;
    desc += "Itinerario:\n";
    stops.forEach((stop, i) => {
      desc += `${i + 1}. ${stop.name}`;
      if (stop.arrivalTime) {
        desc += ` (${stop.arrivalTime})`;
      }
      desc += `\n   ${stop.address}\n`;
    });
    desc += "\n🍺 Creado con Birracrucis";
    return desc;
  };

  // Generate location (first stop)
  const location = stops[0]?.address || "";

  // Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `🍺 ${routeName}`,
      dates: `${formatDateForGoogle(routeDate, startTime)}/${formatDateForGoogle(routeDate, endTime)}`,
      details: generateDescription(),
      location: location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Outlook Calendar URL
  const getOutlookUrl = () => {
    const startDT = new Date(`${routeDate.split("T")[0]}T${startTime}`);
    const endDT = new Date(`${routeDate.split("T")[0]}T${endTime}`);
    const params = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: `🍺 ${routeName}`,
      startdt: startDT.toISOString(),
      enddt: endDT.toISOString(),
      body: generateDescription(),
      location: location,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  // Generate ICS file for Apple Calendar and others
  const generateICS = () => {
    const start = formatDateForICS(routeDate, startTime);
    const end = formatDateForICS(routeDate, endTime);
    const now = new Date().toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, -1);
    const uid = `${Date.now()}@birracrucis.app`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Birracrucis//Bar Crawl//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:🍺 ${routeName}`,
      `DESCRIPTION:${generateDescription().replace(/\n/g, "\\n")}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    return icsContent;
  };

  const downloadICS = () => {
    const ics = generateICS();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${routeName.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Anadir al calendario
      </button>

      {showOptions && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowOptions(false)}
          />

          {/* Options Menu */}
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border p-2 min-w-[200px]">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setShowOptions(false)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-slate-700">Google Calendar</span>
            </a>

            <a
              href={getOutlookUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setShowOptions(false)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#0078D4"
                  d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.352.228-.578.228h-8.537v-6.291l1.645 1.188c.088.064.19.096.307.096.116 0 .218-.032.307-.096l8.009-5.698v-.481zm-.816 0L14.691 13.1l-8.493-5.713h16.986zm-9.2 5.291v6h-7.2c-.226 0-.42-.076-.578-.228-.158-.152-.237-.346-.237-.576V7.387c0-.23.079-.424.237-.576.158-.152.352-.228.578-.228h.862l7.338 4.936v1.159zM7.2 5.387H0V18.43c0 .6.214 1.114.641 1.543.427.428.944.642 1.55.642h12.81v-2.7H2.19V8.08H7.2v-2.693z"
                />
              </svg>
              <span className="text-slate-700">Outlook</span>
            </a>

            <button
              onClick={() => {
                downloadICS();
                setShowOptions(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="text-slate-700">Descargar .ics</span>
            </button>

            <div className="border-t my-2" />

            <p className="px-3 py-1 text-xs text-slate-500">
              El archivo .ics funciona con Apple Calendar, Yahoo y otros
            </p>
          </div>
        </>
      )}
    </div>
  );
}
