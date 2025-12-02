import Link from "next/link";

export const metadata = {
  title: "Aviso Legal - Birracrucis",
  description: "Aviso legal e informacion del titular de Birracrucis",
};

export default function AvisoLegalPage() {
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
          Aviso Legal
        </h1>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              1. Datos Identificativos (Art. 10 LSSI-CE)
            </h2>
            <p className="text-slate-600 mb-3">
              En cumplimiento del articulo 10 de la Ley 34/2002, de 11 de julio,
              de Servicios de la Sociedad de la Informacion y de Comercio Electronico
              (LSSI-CE), se informa a los usuarios de los siguientes datos:
            </p>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-slate-700">
                <strong>Titular:</strong> Luis Miguel Santana Castano
              </p>
              <p className="text-slate-700">
                <strong>NIF:</strong> 79191098M
              </p>
              <p className="text-slate-700">
                <strong>Domicilio:</strong> Ramon J. Sender, 2
              </p>
              <p className="text-slate-700">
                <strong>Email de contacto:</strong>{" "}
                <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">
                  luismi669@gmail.com
                </a>
              </p>
              <p className="text-slate-700">
                <strong>Nombre del sitio web:</strong> Birracrucis
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              2. Objeto
            </h2>
            <p className="text-slate-600">
              El presente aviso legal regula el uso del sitio web y la aplicacion
              Birracrucis, una herramienta para la planificacion y coordinacion
              de rutas de bares entre amigos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              3. Propiedad Intelectual e Industrial
            </h2>
            <p className="text-slate-600">
              Todos los contenidos del sitio web, incluyendo pero no limitado a:
              textos, graficos, imagenes, logotipos, iconos, software y cualquier
              otro material, estan protegidos por derechos de propiedad intelectual
              e industrial, siendo titularidad de Luis Miguel Santana Castano o
              de terceros que han autorizado su uso.
            </p>
            <p className="text-slate-600 mt-3">
              Queda prohibida la reproduccion, distribucion, comunicacion publica,
              transformacion o cualquier otra forma de explotacion de los contenidos
              sin autorizacion expresa del titular.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              4. Condiciones de Uso
            </h2>
            <p className="text-slate-600">El usuario se compromete a:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 mt-3">
              <li>Hacer un uso adecuado de los contenidos y servicios ofrecidos.</li>
              <li>No realizar actividades ilicitas o contrarias a la buena fe.</li>
              <li>No difundir contenidos de caracter racista, xenofobo, pornografico o de apologia del terrorismo.</li>
              <li>No provocar danos en los sistemas fisicos o logicos del sitio web.</li>
              <li>No introducir o difundir virus informaticos o cualquier otro sistema que cause danos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              5. Exclusion de Responsabilidad
            </h2>
            <p className="text-slate-600 mb-3">
              El titular no se hace responsable de:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Los danos y perjuicios derivados del uso inadecuado de la aplicacion.</li>
              <li>Los fallos e incidencias que pudieran producirse en las comunicaciones.</li>
              <li>La veracidad de los contenidos publicados por terceros usuarios.</li>
              <li>Los danos producidos por virus informaticos u otros elementos daninos.</li>
              <li>Los incidentes que puedan ocurrir durante la realizacion de las rutas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              6. Modificaciones
            </h2>
            <p className="text-slate-600">
              El titular se reserva el derecho de efectuar sin previo aviso las
              modificaciones que considere oportunas en el sitio web, pudiendo
              cambiar, suprimir o anadir tanto los contenidos y servicios que se
              presten a traves de la misma como la forma en la que estos aparezcan
              presentados o localizados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              7. Enlaces
            </h2>
            <p className="text-slate-600">
              En el caso de que en el sitio web se incluyesen enlaces a otros
              sitios de Internet, el titular no ejercera ningun control sobre
              dichos sitios y contenidos. En ningun caso asumira responsabilidad
              alguna por los contenidos de algun enlace perteneciente a un sitio
              web ajeno.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              8. Proteccion de Datos
            </h2>
            <p className="text-slate-600">
              El tratamiento de los datos personales de los usuarios se rige por
              nuestra{" "}
              <Link href="/legal/privacidad" className="text-amber-600 hover:underline">
                Politica de Privacidad
              </Link>,
              en cumplimiento del Reglamento General de Proteccion de Datos (RGPD)
              y la Ley Organica 3/2018 de Proteccion de Datos Personales y garantia
              de los derechos digitales (LOPD-GDD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              9. Legislacion Aplicable y Jurisdiccion
            </h2>
            <p className="text-slate-600">
              El presente aviso legal se rige en todos y cada uno de sus extremos
              por la legislacion espanola. Para la resolucion de cualquier controversia
              que pudiera derivarse del acceso o uso de este sitio web, el titular
              y el usuario acuerdan someterse a los Juzgados y Tribunales del
              domicilio del usuario, de conformidad con lo dispuesto en la normativa
              aplicable en materia de consumidores y usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">
              10. Contacto
            </h2>
            <p className="text-slate-600">
              Para cualquier consulta o sugerencia, puede contactar con nosotros
              a traves del correo electronico{" "}
              <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">
                luismi669@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t flex gap-4">
          <Link
            href="/legal/terminos"
            className="text-amber-600 hover:text-amber-700"
          >
            &larr; Terminos y Condiciones
          </Link>
          <Link
            href="/legal/cookies"
            className="text-amber-600 hover:text-amber-700"
          >
            Politica de Cookies &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
