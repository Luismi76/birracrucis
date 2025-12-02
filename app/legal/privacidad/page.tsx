import Link from "next/link";

export const metadata = {
  title: "Politica de Privacidad - Birracrucis",
  description: "Politica de privacidad y proteccion de datos de Birracrucis",
};

export default function PrivacidadPage() {
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
          Politica de Privacidad
        </h1>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
          <p className="text-slate-600">
            <strong>Ultima actualizacion:</strong> {new Date().toLocaleDateString("es-ES")}
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              1. Responsable del Tratamiento
            </h2>
            <ul className="list-none space-y-1 text-slate-600">
              <li><strong>Identidad:</strong> Luis Miguel Santana Castano</li>
              <li><strong>NIF:</strong> 79191098M</li>
              <li><strong>Direccion:</strong> Ramon J. Sender, 2</li>
              <li><strong>Email:</strong> luismi669@gmail.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              2. Datos que Recopilamos
            </h2>
            <p className="text-slate-600 mb-3">
              Birracrucis recopila los siguientes datos personales:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Datos de identificacion:</strong> Nombre, direccion de correo electronico
                y foto de perfil obtenidos a traves de tu cuenta de Google al iniciar sesion.
              </li>
              <li>
                <strong>Datos de geolocalizacion:</strong> Ubicacion GPS en tiempo real cuando
                participas en una ruta, para mostrar tu posicion a otros participantes del grupo.
              </li>
              <li>
                <strong>Contenido generado:</strong> Fotos que subas, mensajes de chat,
                valoraciones de bares y registro de bebidas consumidas.
              </li>
              <li>
                <strong>Datos de uso:</strong> Rutas creadas, participaciones, preferencias
                de notificaciones y configuracion de la cuenta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              3. Finalidad del Tratamiento
            </h2>
            <p className="text-slate-600 mb-3">Tratamos tus datos para:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Gestionar tu cuenta de usuario y autenticacion.</li>
              <li>Permitir la creacion y participacion en rutas de bares.</li>
              <li>Mostrar tu ubicacion a otros participantes de tu grupo durante las rutas.</li>
              <li>Facilitar la comunicacion entre participantes (chat grupal).</li>
              <li>Almacenar y mostrar las fotos y valoraciones que compartas.</li>
              <li>Enviarte notificaciones sobre la actividad de tus rutas (si las activas).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              4. Base Legal del Tratamiento
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Consentimiento (Art. 6.1.a RGPD):</strong> Al registrarte y aceptar
                esta politica, consientes el tratamiento de tus datos para las finalidades descritas.
              </li>
              <li>
                <strong>Ejecucion de contrato (Art. 6.1.b RGPD):</strong> El tratamiento es
                necesario para prestarte el servicio de la aplicacion.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              5. Conservacion de Datos
            </h2>
            <p className="text-slate-600">
              Conservamos tus datos mientras mantengas tu cuenta activa. Los datos de ubicacion
              en tiempo real solo se conservan durante la duracion de cada ruta activa. Puedes
              solicitar la eliminacion de tu cuenta y todos tus datos en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              6. Destinatarios de los Datos
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong>Otros usuarios:</strong> Tu nombre, foto y ubicacion seran visibles
                para los participantes de las rutas en las que participes.
              </li>
              <li>
                <strong>Proveedores de servicios:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Google (autenticacion OAuth)</li>
                  <li>Vercel (alojamiento de la aplicacion)</li>
                  <li>PostgreSQL/Supabase (base de datos)</li>
                  <li>MinIO (almacenamiento de imagenes)</li>
                </ul>
              </li>
            </ul>
            <p className="text-slate-600 mt-2">
              No vendemos ni compartimos tus datos con terceros para fines publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              7. Transferencias Internacionales
            </h2>
            <p className="text-slate-600">
              Algunos de nuestros proveedores (Google, Vercel) pueden procesar datos fuera
              del Espacio Economico Europeo. En estos casos, existen garantias adecuadas
              como las Clausulas Contractuales Tipo de la Comision Europea o la certificacion
              bajo el EU-US Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              8. Tus Derechos (ARCO-POL)
            </h2>
            <p className="text-slate-600 mb-3">
              Conforme al RGPD y la LOPD-GDD, tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong>Acceso:</strong> Conocer que datos tenemos sobre ti.</li>
              <li><strong>Rectificacion:</strong> Corregir datos inexactos.</li>
              <li><strong>Supresion:</strong> Eliminar tus datos (&quot;derecho al olvido&quot;).</li>
              <li><strong>Oposicion:</strong> Oponerte a determinados tratamientos.</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado.</li>
              <li><strong>Limitacion:</strong> Solicitar la limitacion del tratamiento.</li>
            </ul>
            <p className="text-slate-600 mt-3">
              Para ejercer estos derechos, contacta con nosotros en{" "}
              <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">
                luismi669@gmail.com
              </a>{" "}
              o desde la seccion &quot;Mi Perfil&quot; de la aplicacion.
            </p>
            <p className="text-slate-600 mt-2">
              Tambien puedes presentar una reclamacion ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline"
              >
                Agencia Espanola de Proteccion de Datos (AEPD)
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              9. Cookies y Almacenamiento Local
            </h2>
            <p className="text-slate-600">
              Utilizamos cookies tecnicas necesarias para el funcionamiento de la aplicacion
              (sesion de usuario). Tambien usamos almacenamiento local (localStorage) para
              guardar preferencias de la aplicacion. No utilizamos cookies de terceros con
              fines publicitarios o de seguimiento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              10. Seguridad
            </h2>
            <p className="text-slate-600">
              Implementamos medidas tecnicas y organizativas para proteger tus datos:
              conexiones cifradas (HTTPS), autenticacion segura mediante OAuth 2.0,
              y acceso restringido a la base de datos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              11. Menores de Edad
            </h2>
            <p className="text-slate-600">
              Birracrucis esta destinada a mayores de 18 anos. No recopilamos
              conscientemente datos de menores de edad. Si eres menor de 18 anos,
              no utilices esta aplicacion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              12. Modificaciones
            </h2>
            <p className="text-slate-600">
              Podemos actualizar esta politica periodicamente. Te notificaremos
              cualquier cambio significativo a traves de la aplicacion.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link
            href="/legal/terminos"
            className="text-amber-600 hover:text-amber-700"
          >
            Ver Terminos y Condiciones &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
