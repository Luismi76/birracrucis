# 🍺 Birracrucis

Aplicación para organizar jornadas de cervezas entre amigos visitando distintos bares y restaurantes. Inspirada en el pasaporte del Camino de Santiago.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales

# Migrar base de datos
npx prisma migrate dev

# Iniciar desarrollo
npm run dev
```

## 📱 Testing en Móvil

La geolocalización **requiere HTTPS**:

```bash
# Terminal 1: Servidor de desarrollo
npm run dev

# Terminal 2: Túnel HTTPS
npx ngrok http 3000
```

Abre la URL `https://xxxxx.ngrok.io` en tu móvil.

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15
- **Base de Datos**: PostgreSQL + Prisma
- **Mapas**: Google Maps API
- **Estilos**: Tailwind CSS 4
- **UI**: Radix UI + shadcn/ui

## 📖 Documentación

Ver [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) para documentación completa.

## ✨ Funcionalidades

- ✅ Crear rutas con bares/restaurantes
- ✅ Buscar locales con Google Places
- ✅ Geolocalización y detección de proximidad
- ✅ Contador de rondas por local
- ⏳ Fotos compartidas
- ⏳ Gamificación
- ⏳ Multiusuario en tiempo real

## 🐛 Troubleshooting

**Geolocalización no funciona en móvil**
- Asegúrate de usar HTTPS (ngrok en desarrollo)
- Verifica permisos del navegador
- Activa el GPS del dispositivo

**Distancias incorrectas**
```bash
npx tsx check-coordinates.ts
```

Ver [mobile_debug.md](./mobile_debug.md) para más ayuda.

## 📄 Licencia

[Por definir]
