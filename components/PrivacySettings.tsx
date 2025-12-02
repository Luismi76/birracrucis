"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function PrivacySettings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/user/data");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // Crear archivo JSON para descargar
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `birracrucis-datos-${new Date().toISOString().split("T")[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        alert("Error al exportar los datos");
      }
    } catch (err) {
      console.error("Error exporting data:", err);
      alert("Error al exportar los datos");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR MI CUENTA") {
      alert("Por favor, escribe exactamente: ELIMINAR MI CUENTA");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/user/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          alert("Tu cuenta ha sido eliminada. Hasta pronto.");
          signOut({ callbackUrl: "/" });
        } else {
          alert(data.error || "Error al eliminar la cuenta");
        }
      } else {
        alert("Error al eliminar la cuenta");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Error al eliminar la cuenta");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
        <span className="text-xl">🔒</span>
        Privacidad y Datos
      </h3>

      <div className="space-y-4">
        {/* Enlaces legales */}
        <div>
          <p className="text-sm text-slate-600 mb-2">Documentos legales:</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/legal/privacidad"
              className="text-sm text-amber-600 hover:text-amber-700 underline"
            >
              Politica de Privacidad
            </Link>
            <Link
              href="/legal/terminos"
              className="text-sm text-amber-600 hover:text-amber-700 underline"
            >
              Terminos y Condiciones
            </Link>
          </div>
        </div>

        {/* Exportar datos */}
        <div className="border-t pt-4">
          <p className="font-medium text-slate-800">Exportar mis datos</p>
          <p className="text-xs text-slate-500 mb-2">
            Descarga una copia de todos tus datos en formato JSON (Derecho de acceso/portabilidad)
          </p>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600" />
                Exportando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar mis datos
              </>
            )}
          </button>
        </div>

        {/* Eliminar cuenta */}
        <div className="border-t pt-4">
          <p className="font-medium text-red-600">Eliminar mi cuenta</p>
          <p className="text-xs text-slate-500 mb-2">
            Elimina permanentemente tu cuenta y todos tus datos. Esta accion no se puede deshacer.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
          >
            Eliminar mi cuenta
          </button>
        </div>
      </div>

      {/* Modal de confirmacion de eliminacion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Eliminar cuenta
            </h3>

            <p className="text-slate-600 text-sm mb-4">
              Esta accion eliminara <strong>permanentemente</strong> tu cuenta y todos tus datos:
            </p>

            <ul className="text-sm text-slate-600 list-disc pl-5 mb-4 space-y-1">
              <li>Tu perfil y configuracion</li>
              <li>Todas las rutas que has creado</li>
              <li>Tus fotos, mensajes y valoraciones</li>
              <li>Tu historial de bebidas y logros</li>
            </ul>

            <p className="text-sm text-red-600 font-medium mb-3">
              Para confirmar, escribe: ELIMINAR MI CUENTA
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="ELIMINAR MI CUENTA"
              className="w-full p-3 border rounded-lg mb-4 text-center font-mono"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                disabled={deleting}
                className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmation !== "ELIMINAR MI CUENTA"}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
