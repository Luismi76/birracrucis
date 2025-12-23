import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Guia de Uso - Birracrucis",
  description: "Aprende a usar Birracrucis: crear rutas, invitar amigos, contador de rondas, bote compartido y mas",
};

export default function GuiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-amber-600 hover:text-amber-700 text-sm mb-4 inline-block"
        >
          &larr; Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Guia de Uso de Birracrucis
          </h1>
          <p className="text-slate-600 text-lg">
            Todo lo que necesitas saber para organizar la ruta de bares perfecta
          </p>
        </div>

        {/* Indice */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Indice</h2>
          <nav className="grid md:grid-cols-2 gap-2">
            <a href="#empezar" className="text-amber-600 hover:text-amber-700 hover:underline">1. Primeros pasos</a>
            <a href="#crear-ruta" className="text-amber-600 hover:text-amber-700 hover:underline">2. Crear una ruta</a>
            <a href="#invitar" className="text-amber-600 hover:text-amber-700 hover:underline">3. Invitar amigos</a>
            <a href="#durante-ruta" className="text-amber-600 hover:text-amber-700 hover:underline">4. Durante la ruta</a>
            <a href="#contador" className="text-amber-600 hover:text-amber-700 hover:underline">5. Registro de Consumo</a>
            <a href="#bote" className="text-amber-600 hover:text-amber-700 hover:underline">6. Gestión de Gastos</a>
            <a href="#chat" className="text-amber-600 hover:text-amber-700 hover:underline">7. Chat y fotos</a>
            <a href="#valoraciones" className="text-amber-600 hover:text-amber-700 hover:underline">8. Valoraciones</a>
            <a href="#gamificacion" className="text-amber-600 hover:text-amber-700 hover:underline">9. Tu Historial</a>
            <a href="#exportar" className="text-amber-600 hover:text-amber-700 hover:underline">10. Exportar PDF</a>
            <a href="#consejos" className="text-amber-600 hover:text-amber-700 hover:underline">11. Consejos</a>
          </nav>
        </div>

        {/* Seccion 1: Primeros pasos */}
        <section id="empezar" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
            Primeros pasos
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              <strong>Iniciar sesión:</strong> Birracrucis usa tu cuenta de Google para identificarte.
              Solo tienes que pulsar &quot;Entrar con Google&quot; y autorizar la app.
            </p>
            <p>
              <strong>Pantalla principal:</strong> Una vez dentro, veras tu lista de rutas organizadas en:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Mis rutas creadas:</strong> Las rutas que tu has organizado</li>
              <li><strong>Invitaciones:</strong> Rutas a las que te han invitado otros</li>
            </ul>
            <div className="mt-4 flex justify-center">
              <div className="bg-slate-100 rounded-2xl p-2 max-w-[250px]">
                <Image
                  src="/guia/screenshot-lista.png"
                  alt="Lista de rutas"
                  width={250}
                  height={500}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seccion 2: Crear ruta */}
        <section id="crear-ruta" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
            Crear una ruta
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Pulsa el boton <strong className="text-amber-600">+</strong> en la pantalla principal para crear una nueva ruta.
            </p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <strong>Nombre de la ruta:</strong> Ponle un nombre descriptivo (ej: &quot;Cumple de Juan&quot;, &quot;Viernes loco&quot;)
              </li>
              <li>
                <strong>Fecha y hora:</strong> Cuando empieza la ruta
              </li>
              <li>
                <strong>Buscar bares:</strong> Usa el mapa para buscar bares. Pulsa en el mapa o busca por nombre.
              </li>
              <li>
                <strong>Anadir paradas:</strong> Selecciona cada bar y pulsa &quot;Anadir&quot;. Puedes poner cuantas rondas planeas en cada uno.
              </li>
              <li>
                <strong>Ordenar:</strong> Arrastra las paradas para ordenarlas segun tu itinerario ideal.
              </li>
            </ol>
            <div className="bg-amber-50 rounded-lg p-4 mt-4">
              <p className="text-amber-800 text-sm">
                <strong>Consejo:</strong> No hace falta que la ruta sea perfecta. Puedes editarla despues
                e incluso anadir bares sobre la marcha durante la ruta.
              </p>
            </div>
          </div>
        </section>

        {/* Seccion 3: Invitar */}
        <section id="invitar" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
            Invitar amigos
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Una vez creada la ruta, puedes invitar a tus amigos de dos formas:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Codigo de invitacion</h4>
                <p className="text-sm">
                  En el menu de la ruta (tres puntos), pulsa &quot;Compartir&quot;. Copiaras un codigo
                  unico que tus amigos pueden introducir en la app.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Enlace directo</h4>
                <p className="text-sm">
                  Tambien puedes compartir el enlace por WhatsApp, Telegram o cualquier app.
                  Al abrirlo, tus amigos se uniran automaticamente.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Los invitados necesitan tener cuenta en Birracrucis (registro gratuito con Google).
            </p>
          </div>
        </section>

        {/* Seccion 4: Durante la ruta */}
        <section id="durante-ruta" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
            Durante la ruta
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Cuando llegue el momento, abre la ruta y veras el panel principal:
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <strong>Mapa:</strong> Ve donde estan todos los participantes y los bares de la ruta.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <strong>Check-in automatico:</strong> Cuando te acerques a menos de 50m de un bar,
                    la app te hace check-in automaticamente.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <strong>Progreso:</strong> Ve cuantos bares llevas, cervezas totales y gasto acumulado.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">➡️</span>
                  <div>
                    <strong>Siguiente bar:</strong> Pulsa el boton verde para avanzar al siguiente bar de la ruta.
                  </div>
                </div>
              </div>
              <div className="bg-slate-100 rounded-2xl p-2 max-w-[200px]">
                <Image
                  src="/guia/screenshot-ruta.png"
                  alt="Vista de ruta activa"
                  width={200}
                  height={400}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <p className="text-blue-800 text-sm">
                <strong>Importante:</strong> Para que funcione la geolocalizacion, debes dar permisos
                de ubicacion a la app y tener el GPS activado.
              </p>
            </div>
          </div>
        </section>

        {/* Seccion 5: Registro de Consumo */}
        <section id="contador" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">5</span>
            Registro de Consumo
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Lleva un control detallado del consumo en cada establecimiento. Transparencia total para el grupo:
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Registrar consumición:</strong> Añade lo que se ha pedido para mantener el registro actualizado.</li>
                  <li><strong>Tipos de bebida:</strong> Clasificación por tipo para mayor detalle.</li>
                  <li><strong>Control de costes:</strong> Asigna precios para tener una estimación del gasto en tiempo real.</li>
                  <li><strong>Desglose:</strong> Visualiza el consumo individual si es necesario.</li>
                </ul>
                <div className="bg-green-50 rounded-lg p-4 mt-4">
                  <p className="text-green-800 text-sm">
                    <strong>Plan cumplido:</strong> La app te notificará cuando se haya completado lo planificado en el local.
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 rounded-2xl p-2 max-w-[200px]">
                <Image
                  src="/guia/screenshot-contador.png"
                  alt="Contador de rondas"
                  width={200}
                  height={400}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seccion 6: Gestión de Gastos */}
        <section id="bote" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">6</span>
            Gestión de Gastos
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Simplifica la logística financiera del encuentro. Cuentas claras, amistades largas:
            </p>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Fondo común:</strong> El organizador define la aportación inicial por persona.</li>
                  <li><strong>Aportaciones:</strong> Registro de quién ha pagado su parte.</li>
                  <li><strong>Estado del fondo:</strong> Balance en tiempo real de gastos y remanente.</li>
                  <li><strong>Participantes:</strong> Control de pagos pendientes.</li>
                </ol>
                <div className="bg-amber-50 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Nota:</strong> Esta herramienta es un libro de registro digital. Facilita la contabilidad del dinero físico del grupo.
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 rounded-2xl p-2 max-w-[200px]">
                <Image
                  src="/guia/screenshot-bote.png"
                  alt="Bote compartido"
                  width={200}
                  height={400}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seccion 7: Chat */}
        <section id="chat" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">7</span>
            Chat y fotos
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Cada ruta tiene su propio chat para coordinarse:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chat grupal:</strong> Pulsa el boton azul de chat para enviar mensajes a todos</li>
              <li><strong>Tiempo real:</strong> Los mensajes llegan al instante a todos los participantes</li>
              <li><strong>Fotos:</strong> Comparte fotos de la ruta directamente desde el chat</li>
              <li><strong>Notificaciones:</strong> Recibe alertas cuando alguien escribe (si las tienes activadas)</li>
            </ul>
            <div className="bg-purple-50 rounded-lg p-4 mt-4">
              <p className="text-purple-800 text-sm">
                <strong>Privacidad:</strong> El chat solo es visible para los participantes de esa ruta.
              </p>
            </div>
          </div>
        </section>

        {/* Seccion 8: Valoraciones */}
        <section id="valoraciones" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">8</span>
            Valoraciones
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Al terminar en cada bar, puedes valorarlo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Puntuacion:</strong> De 1 a 5 estrellas</li>
              <li><strong>Comentario:</strong> Anade notas sobre el bar (ambiente, precios, servicio...)</li>
              <li><strong>Historial:</strong> Tus valoraciones se guardan para futuras rutas</li>
            </ul>
            <p className="text-sm text-slate-500">
              Las valoraciones ayudan a recordar que bares merecen la pena para proximas rutas.
            </p>
          </div>
        </section>

        {/* Seccion 9: Historial */}
        <section id="gamificacion" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">9</span>
            Tu Historial y Logros
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Mantén un registro de tus experiencias. Birracrucis guarda tu actividad para que recuerdes cada aventura.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Experiencia:</strong> Acumula conocimientos sobre rutas y locales de tu ciudad.</li>
              <li><strong>Estatus:</strong> Tu perfil refleja tu nivel de actividad y experiencia como organizador.</li>
              <li><strong>Medallas:</strong> Reconocimientos especiales a tu participación (ej: "Explorador", "Organizador Top").</li>
              <li><strong>Comunidad:</strong> Comparte tu afición con otros usuarios locales.</li>
            </ul>
            <p className="text-sm text-slate-500">
              Consulta tu historial completo en tu Perfil.
            </p>
          </div>
        </section>

        {/* Seccion 10: Exportar */}
        <section id="exportar" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">10</span>
            Exportar PDF
          </h2>
          <div className="space-y-4 text-slate-600">
            <p>
              Cuando termine la ruta, puedes exportar un resumen en PDF:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lista de bares visitados</li>
              <li>Rondas consumidas en cada bar</li>
              <li>Gasto total y por persona</li>
              <li>Participantes</li>
              <li>Valoraciones de cada bar</li>
            </ul>
            <p className="text-sm text-slate-500">
              Encuentra esta opcion en el menu de la ruta (tres puntos) → &quot;Exportar PDF&quot;
            </p>
          </div>
        </section>

        {/* Seccion 11: Consejos */}
        <section id="consejos" className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">11</span>
            Consejos para una ruta perfecta
          </h2>
          <div className="space-y-4 text-slate-600">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Antes de la ruta</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Crea la ruta con tiempo para que todos se unan</li>
                  <li>• Elige bares cercanos entre si</li>
                  <li>• Calcula 1-2 rondas por bar como maximo</li>
                  <li>• Activa el bote si vais a pagar a escote</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Durante la ruta</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Asegurate de tener bateria suficiente</li>
                  <li>• Activa el GPS para el check-in automatico</li>
                  <li>• Usa el chat para coordinaros</li>
                  <li>• Haz fotos para el recuerdo</li>
                </ul>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-red-800 mb-2">Recuerda</h4>
              <p className="text-red-700 text-sm">
                Bebe con responsabilidad. No conduzcas si has bebido. Cuida de tus amigos.
              </p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">¿Listo para tu primera ruta?</h2>
          <p className="mb-4 text-amber-100">Crea una ruta ahora y empieza a disfrutar</p>
          <Link
            href="/routes/new"
            className="inline-block bg-white text-amber-600 font-semibold px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Crear mi primera ruta
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>¿Tienes dudas? Contacta en <a href="mailto:luismi669@gmail.com" className="text-amber-600 hover:underline">luismi669@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
