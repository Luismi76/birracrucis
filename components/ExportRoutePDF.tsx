"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

type Stop = {
  id: string;
  name: string;
  address: string | null;
  plannedRounds: number;
  actualRounds: number;
  arrivedAt: string | null;
  leftAt: string | null;
};

type Participant = {
  id: string;
  name: string | null;
  image: string | null;
};

type RouteData = {
  id: string;
  name: string;
  date: string;
  status: string;
  stops: Stop[];
  participants: Participant[];
  totalDrinks?: number;
  totalPhotos?: number;
};

type ExportRoutePDFProps = {
  route: RouteData;
};

export default function ExportRoutePDF({ route }: ExportRoutePDFProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header con titulo
      doc.setFillColor(217, 119, 6); // amber-600
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("BIRRACRUCIS", pageWidth / 2, 18, { align: "center" });

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text(route.name, pageWidth / 2, 32, { align: "center" });

      y = 55;

      // Info de la ruta
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informacion de la Ruta", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const routeDate = new Date(route.date);
      doc.text(
        `Fecha: ${routeDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        15,
        y
      );
      y += 6;

      doc.text(
        `Hora: ${routeDate.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        15,
        y
      );
      y += 6;

      doc.text(`Estado: ${getStatusLabel(route.status)}`, 15, y);
      y += 6;

      doc.text(`Total de paradas: ${route.stops.length}`, 15, y);
      y += 6;

      if (route.totalDrinks) {
        doc.text(`Bebidas consumidas: ${route.totalDrinks}`, 15, y);
        y += 6;
      }

      if (route.totalPhotos) {
        doc.text(`Fotos tomadas: ${route.totalPhotos}`, 15, y);
        y += 6;
      }

      y += 10;

      // Participantes
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Participantes (${route.participants.length})`, 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const participantNames = route.participants
        .map((p) => p.name || "Anonimo")
        .join(", ");

      // Wrap text for participants
      const splitParticipants = doc.splitTextToSize(participantNames, pageWidth - 30);
      doc.text(splitParticipants, 15, y);
      y += splitParticipants.length * 5 + 10;

      // Tabla de paradas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Itinerario", 15, y);
      y += 10;

      // Header de tabla
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, y - 5, pageWidth - 30, 10, "F");

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("#", 20, y);
      doc.text("Bar", 30, y);
      doc.text("Direccion", 80, y);
      doc.text("Rondas", 145, y);
      doc.text("Llegada", 170, y);
      y += 8;

      // Filas de paradas
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      route.stops.forEach((stop, index) => {
        // Check if we need a new page
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Alternar colores de fila
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(15, y - 4, pageWidth - 30, 8, "F");
        }

        doc.setFontSize(9);
        doc.text(`${index + 1}`, 20, y);

        // Truncar nombre si es muy largo
        const stopName = stop.name.length > 20 ? stop.name.substring(0, 18) + "..." : stop.name;
        doc.text(stopName, 30, y);

        // Direccion truncada
        const address = stop.address || "-";
        const shortAddress = address.length > 25 ? address.substring(0, 23) + "..." : address;
        doc.text(shortAddress, 80, y);

        // Rondas
        doc.text(`${stop.actualRounds}/${stop.plannedRounds}`, 148, y);

        // Hora de llegada
        if (stop.arrivedAt) {
          const arrivedTime = new Date(stop.arrivedAt).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
          doc.text(arrivedTime, 170, y);
        } else {
          doc.text("-", 170, y);
        }

        y += 8;
      });

      y += 15;

      // Estadisticas resumen
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      const completedStops = route.stops.filter(
        (s) => s.actualRounds >= s.plannedRounds
      ).length;
      const totalPlannedRounds = route.stops.reduce((acc, s) => acc + s.plannedRounds, 0);
      const totalActualRounds = route.stops.reduce((acc, s) => acc + s.actualRounds, 0);

      doc.setFillColor(217, 119, 6, 0.1);
      doc.roundedRect(15, y, pageWidth - 30, 35, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(217, 119, 6);
      doc.text("Resumen", 20, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Paradas completadas: ${completedStops} de ${route.stops.length}`, 20, y + 18);
      doc.text(`Rondas totales: ${totalActualRounds} de ${totalPlannedRounds} planificadas`, 20, y + 26);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Generado el ${new Date().toLocaleDateString("es-ES")} - Pagina ${i} de ${pageCount}`,
          pageWidth / 2,
          290,
          { align: "center" }
        );
        doc.text("Birracrucis - La mejor app para bar crawls", pageWidth / 2, 295, {
          align: "center",
        });
      }

      // Guardar el PDF
      const fileName = `birracrucis-${route.name.replace(/[^a-zA-Z0-9]/g, "_")}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Intentalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          Generando...
        </>
      ) : (
        <>
          <span>📄</span>
          Exportar PDF
        </>
      )}
    </button>
  );
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Borrador";
    case "active":
      return "En curso";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    default:
      return status;
  }
}
