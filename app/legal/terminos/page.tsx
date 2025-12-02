import Link from "next/link";

export const metadata = {
  title: "Terminos y Condiciones - Birracrucis",
  description: "Terminos y condiciones de uso de Birracrucis",
};

export default function TerminosPage() {
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
          Terminos y Condiciones de Uso
        </h1>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
          <p className="text-slate-600">
            <strong>Ultima actualizacion:</strong> {new Date().toLocaleDateString("es-ES")}
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              1. Identificacion del Titular
            </h2>
            <ul className="list-none space-y-1 text-slate-600">
              <li><strong>Titular:</strong> Luis Miguel Santana Castano</li>
              <li><strong>NIF:</strong> 79191098M</li>
              <li><strong>Direccion:</strong> Ramon J. Sender, 2</li>
              <li><strong>Email:</strong> luismi669@gmail.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              2. Objeto y Aceptacion
            </h2>
            <p className="text-slate-600">
              Birracrucis es una aplicacion web que permite a los usuarios planificar
              y coordinar rutas de bares con amigos. Al registrarte y usar la aplicacion,
              aceptas estos terminos y condiciones en su totalidad.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              3. Requisitos de Uso
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Debes ser mayor de 18 anos para usar esta aplicacion.</li>
              <li>Debes proporcionar informacion veraz al registrarte.</li>
              <li>Eres responsable de mantener la confidencialidad de tu cuenta.</li>
              <li>No debes usar la aplicacion para actividades ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              4. Servicios Ofrecidos
            </h2>
            <p className="text-slate-600 mb-3">Birracrucis ofrece las siguientes funcionalidades:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Creacion y gestion de rutas de bares.</li>
              <li>Invitacion de amigos a participar en rutas.</li>
              <li>Seguimiento de ubicacion en tiempo real durante las rutas.</li>
              <li>Chat grupal entre participantes.</li>
              <li>Compartir fotos y valoraciones de los bares visitados.</li>
              <li>Contador de bebidas y gestion de bote comun.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              5. Uso de la Geolocalizacion
            </h2>
            <p className="text-slate-600">
              La aplicacion utiliza tu ubicacion GPS para mostrarte en el mapa a otros
              participantes de tu grupo. Esta funcion es voluntaria y puedes desactivarla
              en cualquier momento, aunque limitara algunas funcionalidades como el
              check-in automatico en bares.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              6. Contenido del Usuario
            </h2>
            <p className="text-slate-600 mb-3">
              Al subir contenido (fotos, mensajes, valoraciones) a Birracrucis:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Garantizas que tienes derechos sobre dicho contenido.</li>
              <li>Nos concedes una licencia no exclusiva para mostrar el contenido a otros usuarios.</li>
              <li>Te comprometes a no subir contenido ilegal, ofensivo o que vulnere derechos de terceros.</li>
              <li>Nos reservamos el derecho de eliminar contenido inapropiado.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              7. Consumo Responsable
            </h2>
            <p className="text-slate-600">
              <strong>Birracrucis promueve el consumo responsable de alcohol.</strong> La
              aplicacion es una herramienta de organizacion social y no fomenta el consumo
              excesivo. Te recordamos que:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-3">
              <li>No debes conducir bajo los efectos del alcohol.</li>
              <li>El consumo excesivo de alcohol es perjudicial para la salud.</li>
              <li>Eres responsable de tu propio consumo y comportamiento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              8. Limitacion de Responsabilidad
            </h2>
            <p className="text-slate-600">
              Birracrucis se ofrece &quot;tal cual&quot; sin garantias de ningun tipo. No nos
              hacemos responsables de:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-3">
              <li>Danos derivados del uso o imposibilidad de uso de la aplicacion.</li>
              <li>La exactitud de la informacion de los bares mostrados.</li>
              <li>El comportamiento de otros usuarios.</li>
              <li>Perdidas economicas relacionadas con el bote comun (es una herramienta organizativa, no financiera).</li>
              <li>Incidentes ocurridos durante las rutas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              9. Propiedad Intelectual
            </h2>
            <p className="text-slate-600">
              Todos los derechos de propiedad intelectual sobre la aplicacion
              (codigo, diseno, marca, logos) pertenecen a Luis Miguel Santana Castano.
              Queda prohibida su reproduccion sin autorizacion expresa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              10. Modificaciones del Servicio
            </h2>
            <p className="text-slate-600">
              Nos reservamos el derecho de modificar, suspender o discontinuar
              cualquier aspecto de la aplicacion en cualquier momento, con o sin previo aviso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              11. Terminacion de Cuenta
            </h2>
            <p className="text-slate-600">
              Puedes cancelar tu cuenta en cualquier momento desde la seccion &quot;Mi Perfil&quot;.
              Nos reservamos el derecho de suspender o eliminar cuentas que violen estos terminos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              12. Legislacion Aplicable
            </h2>
            <p className="text-slate-600">
              Estos terminos se rigen por la legislacion espanola. Para cualquier
              controversia, las partes se someten a los juzgados y tribunales de
              la ciudad de residencia del usuario, conforme a la normativa de consumidores.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              13. Contacto
            </h2>
            <p className="text-slate-600">
              Para cualquier consulta sobre estos terminos, contacta con nosotros en{" "}
              <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">
                luismi669@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t flex gap-4">
          <Link
            href="/legal/privacidad"
            className="text-amber-600 hover:text-amber-700"
          >
            &larr; Politica de Privacidad
          </Link>
          <Link
            href="/legal/aviso"
            className="text-amber-600 hover:text-amber-700"
          >
            Aviso Legal &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
