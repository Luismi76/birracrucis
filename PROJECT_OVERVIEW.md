# 🍺 Birracrucis - Documentación del Proyecto

## 📖 Concepto

Aplicación para organizar jornadas de cervezas entre amigos visitando distintos bares/restaurantes de una localidad. Inspirada en el "pasaporte del Camino de Santiago", donde los participantes "fichan" en cada local del recorrido.

**Nombre**: Birracrucis (juego de palabras con cerveza y vía crucis)

---

## ✨ Funcionalidades Implementadas

### 1. Creación de Rutas ✅
- Crear Birracrucis seleccionando bares y restaurantes
- Integración con Google Places API para buscar locales cercanos
- Búsqueda por ubicación (lat/lng) con radio configurable
- Guardar información completa: nombre, dirección, coordenadas, Google Place ID
- Configurar rondas previstas y máximas por local

### 2. Registro de Rondas ✅
- Sistema de contador de rondas por local (no por persona)
- Límites configurables de rondas por bar
- Visualización de rondas previstas vs. actuales

### 3. Geolocalización ✅
- Detección de posición en tiempo real
- Validación de proximidad a locales (radio: 75m)
- Cálculo preciso de distancias con fórmula Haversine
- **Requiere HTTPS** para funcionar en móvil
- Validación de precisión GPS (umbral: 150m)

### 4. Herramientas de Testing ✅
- Botones "📍 Simular aquí" para testing sin GPS
- Simulación manual de coordenadas
- Modo de seguimiento continuo (watchPosition)
- Logging detallado en consola

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 16 (React 19)
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL + Prisma ORM
- **Mapas**: Google Maps API
- **Estilos**: Tailwind CSS 4
- **Componentes UI**: Radix UI + shadcn/ui

### Estructura de Base de Datos

```prisma
model Route {
  id        String      @id @default(cuid())
  name      String
  date      DateTime
  createdAt DateTime    @default(now())
  stops     RouteStop[]
}

model RouteStop {
  id            String   @id @default(cuid())
  route         Route    @relation(fields: [routeId], references: [id])
  routeId       String
  name          String
  address       String
  lat           Float
  lng           Float
  order         Int
  plannedRounds Int
  maxRounds     Int?
  actualRounds  Int      @default(0)
  googlePlaceId String?
}
```

---

## 🔧 Problemas Resueltos

### ✅ Coordenadas Inválidas
- **Problema**: 4 bares guardados con coordenadas `0, 0`
- **Solución**: Validación exhaustiva en frontend y backend
- **Prevención**: No permite guardar coordenadas NaN, 0,0, o fuera de rango

### ✅ Geolocalización en Móvil
- **Problema**: No funcionaba en móvil (requiere HTTPS)
- **Solución**: Uso de ngrok para desarrollo, HTTPS en producción
- **Mejora**: Mensajes de error específicos según el tipo de problema

### ✅ GPS Impreciso en Portátil
- **Problema**: Portátiles sin GPS usan WiFi/IP (precisión ~5km)
- **Solución**: Botones de simulación rápida, advertencias claras
- **Recomendación**: Usar móvil con GPS para testing real

### ✅ Cálculo de Distancias
- **Problema**: Distancias incorrectas por coordenadas inválidas
- **Solución**: Validación de inputs, retorna Infinity si hay error
- **Verificación**: Fórmula Haversine correctamente implementada

---

## 🚀 Estado Actual

### Funcionalidades Completas
- ✅ Crear rutas con bares/restaurantes
- ✅ Buscar locales con Google Places
- ✅ Guardar coordenadas validadas
- ✅ Calcular distancias precisas
- ✅ Detectar proximidad a locales
- ✅ Simulación para testing (solo desarrollo)
- ✅ Manejo robusto de errores
- ✅ **Autenticación Completa** (Google + Dev)
- ✅ **Subida de Fotos** por parada
- ✅ **Leaderboard** (Ranking de usuarios)

### Pendientes
- ⏳ Sincronización multiusuario en tiempo real (WebSockets)
- ⏳ Compartir rutas entre usuarios (Social)
- ⏳ Selector de posición en mapa mejorado
- ⏳ Compartir rutas entre usuarios

---

## 📱 Desarrollo y Testing

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar base de datos (si usas Docker)
docker-compose up -d

# Migrar base de datos
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Testing en Móvil (HTTPS requerido)

**Opción 1: ngrok** (recomendado para desarrollo)
```bash
# Terminal 1
npm run dev

# Terminal 2
npx ngrok http 3000
```
Abre la URL `https://xxxxx.ngrok.io` en tu móvil.

**Opción 2: Simulación**
Usa los botones "📍 Simular aquí" en cada bar.

### Scripts de Utilidad

```bash
# Verificar coordenadas en BD
npx tsx check-coordinates.ts

# Calcular distancias manualmente
npx tsx calculate-distance.ts

# Abrir Prisma Studio
npx prisma studio
```

---

## 🔐 Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/birracrucis"

# Google Maps API
GOOGLE_MAPS_API_KEY="tu_api_key_server_side"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu_api_key_client_side"
```

---

## 🚀 Despliegue a Producción

### Opciones Recomendadas

**Vercel** (más fácil)
```bash
npm install -g vercel
vercel
```

**Railway, Netlify, Render**
- Todos incluyen HTTPS automático
- Configuración sencilla de variables de entorno
- Soporte para PostgreSQL

### Checklist Pre-Deploy
- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL en producción
- [ ] Google Maps API con restricciones configuradas
- [ ] HTTPS habilitado (automático en plataformas modernas)
- [ ] Migraciones de Prisma ejecutadas

---

## 📊 Configuración Ajustable

### Radio de Detección
```typescript
// app/routes/[id]/RouteDetailClient.tsx
const RADIUS_METERS = 75; // Ajustar según necesidad
```
Recomendación: 75-150m dependiendo del caso de uso.

### Umbral de Precisión GPS
```typescript
const ACCURACY_THRESHOLD = 150; // metros
```
Si la precisión es peor, se considera no fiable.

---

## 🐛 Troubleshooting

### Geolocalización no funciona
1. ✅ Verificar que sea HTTPS (o localhost)
2. ✅ Revisar permisos del navegador
3. ✅ Comprobar que GPS esté activado
4. ✅ Ver consola para errores específicos

### Distancias incorrectas
1. ✅ Ejecutar `npx tsx check-coordinates.ts`
2. ✅ Verificar coordenadas en Prisma Studio
3. ✅ Comprobar logs en consola
4. ✅ Usar simulación para verificar cálculos

### Build falla
- Problema conocido con Turbopack en Next.js 16
- Usar `npm run dev` para desarrollo
- Para producción, Vercel/Railway manejan el build

---

## 📝 Próximos Pasos

### Corto Plazo
1. Implementar subida de fotos por local
2. Sistema de autenticación (NextAuth.js)
3. Compartir rutas entre usuarios
4. Selector de posición en mapa

### Medio Plazo
1. Gamificación básica (puntos, sellos)
2. Sincronización en tiempo real (WebSockets o Pusher)
3. PWA para instalación en móvil
4. Notificaciones push

### Largo Plazo
1. Sistema de rankings
2. Rutas públicas vs. privadas
3. Integración con redes sociales
4. Estadísticas y análisis

---

## 📚 Documentación Adicional

- `walkthrough.md`: Resumen de correcciones de ubicación
- `mobile_debug.md`: Guía de diagnóstico móvil
- `MOBILE_GEOLOCATION_DEBUG.md`: Troubleshooting detallado
- `check-coordinates.ts`: Script de verificación de BD
- `calculate-distance.ts`: Calculadora de distancias

---

## 🤝 Contribución

Para añadir nuevas funcionalidades:
1. Crear rama desde `main`
2. Implementar cambios
3. Probar en móvil con ngrok
4. Verificar coordenadas con scripts de utilidad
5. Crear PR con descripción detallada

---

## 📄 Licencia

[Definir licencia según preferencia]

---

**Última actualización**: 29 de noviembre de 2025
**Versión**: 0.1.0 (MVP)
