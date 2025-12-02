import Link from "next/link";

export const metadata = {
  title: "Politica de Cookies - Birracrucis",
  description: "Politica de cookies y almacenamiento local de Birracrucis",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
        <Link
          href="/"
          className="text-amber-600 hover:text-amber-700 text-sm mb-4 inline-block"
        >
          &larr; Volver al inicio
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Politica de Cookies
        </h1>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
          <p className="text-slate-600">
            <strong>Ultima actualizacion:</strong> {new Date().toLocaleDateString("es-ES")}
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              1. Que son las Cookies
            </h2>
            <p className="text-slate-600">
              Las cookies son pequenos archivos de texto que los sitios web almacenan
              en tu dispositivo cuando los visitas. Permiten al sitio recordar tus
              acciones y preferencias durante un periodo de tiempo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              2. Cookies que Utilizamos
            </h2>
            <p className="text-slate-600 mb-3">
              Birracrucis utiliza exclusivamente cookies tecnicas necesarias para
              el funcionamiento de la aplicacion:
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Nombre</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Tipo</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Finalidad</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Duracion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b text-slate-600">next-auth.session-token</td>
                    <td className="px-4 py-2 border-b text-slate-600">Tecnica</td>
                    <td className="px-4 py-2 border-b text-slate-600">Mantener la sesion de usuario</td>
                    <td className="px-4 py-2 border-b text-slate-600">30 dias</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b text-slate-600">next-auth.csrf-token</td>
                    <td className="px-4 py-2 border-b text-slate-600">Tecnica</td>
                    <td className="px-4 py-2 border-b text-slate-600">Proteccion contra ataques CSRF</td>
                    <td className="px-4 py-2 border-b text-slate-600">Sesion</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-600">next-auth.callback-url</td>
                    <td className="px-4 py-2 text-slate-600">Tecnica</td>
                    <td className="px-4 py-2 text-slate-600">Redireccion tras login</td>
                    <td className="px-4 py-2 text-slate-600">Sesion</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              3. Almacenamiento Local (localStorage)
            </h2>
            <p className="text-slate-600 mb-3">
              Ademas de cookies, utilizamos el almacenamiento local del navegador
              para guardar preferencias de la aplicacion:
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Clave</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 border-b">Finalidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 border-b text-slate-600">birracrucis-visited</td>
                    <td className="px-4 py-2 border-b text-slate-600">Evitar mostrar splash screen en cada visita</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 border-b text-slate-600">birracrucis-cookie-consent</td>
                    <td className="px-4 py-2 border-b text-slate-600">Recordar aceptacion de cookies</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-slate-600">birracrucis-legal-accepted</td>
                    <td className="px-4 py-2 text-slate-600">Aceptacion de terminos legales</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              4. Cookies de Terceros
            </h2>
            <p className="text-slate-600">
              <strong>No utilizamos cookies de terceros</strong> con fines publicitarios
              o de seguimiento. La unica interaccion con servicios externos es:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-3">
              <li>
                <strong>Google OAuth:</strong> Para la autenticacion. Google puede
                establecer sus propias cookies durante el proceso de login.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              5. Como Gestionar las Cookies
            </h2>
            <p className="text-slate-600 mb-3">
              Puedes configurar tu navegador para bloquear o eliminar cookies.
              Ten en cuenta que si bloqueas las cookies tecnicas, la aplicacion
              no funcionara correctamente.
            </p>
            <p className="text-slate-600">
              Enlaces a la configuracion de cookies de los navegadores mas comunes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-3">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              6. Base Legal
            </h2>
            <p className="text-slate-600">
              El uso de cookies tecnicas se basa en nuestro interes legitimo de
              proporcionar el servicio solicitado (Art. 6.1.f RGPD). Estas cookies
              son estrictamente necesarias y estan exentas del requisito de
              consentimiento segun el Art. 22.2 de la LSSI-CE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              7. Actualizaciones
            </h2>
            <p className="text-slate-600">
              Esta politica puede ser actualizada periodicamente. Te recomendamos
              revisarla de vez en cuando para estar informado sobre como utilizamos
              las cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              8. Contacto
            </h2>
            <p className="text-slate-600">
              Si tienes alguna pregunta sobre nuestra politica de cookies, puedes
              contactarnos en{" "}
              <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">
                luismi669@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link
            href="/legal/aviso"
            className="text-amber-600 hover:text-amber-700"
          >
            &larr; Aviso Legal
          </Link>
        </div>
      </div>
    </div>
  );
}
