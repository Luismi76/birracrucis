# 🏗️ Arquitectura del Proyecto Birracrucis

Este documento describe la arquitectura técnica de alto nivel de la aplicación, reflejando las refactorizaciones y patrones modernos implementados.

## 🛠️ Stack Tecnológico

*   **Frontend**: Next.js 15 (App Router), React 19.
*   **Estilos**: Tailwind CSS 4.
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Base de Datos**: PostgreSQL (via Prisma ORM).
*   **Validación**: Zod.
*   **Mapas**: Google Maps JavaScript API (@react-google-maps/api).

## 📂 Estructura del Proyecto

### `app/`
Utiliza el App Router de Next.js.
*   `app/api/`: Endpoints del backend.
    *   `api/routes/route.ts`: Endpoint principal de creación, protegido con **Zod**.
*   `app/routes/`: Páginas de rutas (frontend).

### `components/`
Componentes React reutilizables.
*   `RouteDetailMap/`: **[REFACTORIZADO]** Módulo encapsulado para el mapa detalle.
    *   `index.tsx`: Orquestador principal.
    *   `BarTooltip.tsx`: Sub-componente para tooltips de bares (Google Places).
    *   `ParticipantMarkers.tsx`: Sub-componente para clustering y avatares.
    *   `types.ts`: Tipos locales del mapa.
*   `ui/`: Componentes base (botones, inputs, etc).

### `lib/`
Utilidades y configuración compartida.
*   `validations/`: Esquemas de validación **Zod** (Single Source of Truth para validaciones).
    *   `route.ts`: Esquema para creación/edición de rutas.
*   `geo-utils.ts`: Funciones puras para cálculos geográficos (Haversine, etc).
*   `auth.ts`: Configuración de NextAuth.
*   `prisma.ts`: Cliente singleton de Prisma.

## 📐 Patrones Clave

### 1. Validación Estricta (Backend)
Toda entrada de datos a la API debe ser validada con **Zod** antes de procesarse.
*   **Beneficio**: Type-safety de extremo a extremo y mensajes de error claros.
*   **Ubicación**: `lib/validations/`.

### 2. Componentización Modular (Frontend)
Los componentes complejos (como mapas o formularios grandes) se dividen en sub-componentes ubicados en su propia carpeta dentro de `components/`.
*   **Ejemplo**: `components/RouteDetailMap/`.
*   **Regla**: Evitar "God Components" de >500 líneas.

### 3. Separation of Concerns (Mapas)
*   **Lógica de UI**: Tooltips y Marcadores HTML (`OverlayView`) separados del mapa base.
*   **Lógica de Negocio**: Clustering y filtrado de participantes en hooks o componentes dedicados (`ParticipantMarkers`).

## 🔄 Flujo de Datos (Creación de Ruta)
1.  **Frontend**: Envía JSON al endpoint `/api/routes`.
2.  **API Handler**: Recibe request.
3.  **Zod Layer**: Valida el JSON contra `createRouteSchema`.
    *   *Fallo*: Retorna 400 Bad Request con detalles.
    *   *Éxito*: Pasa datos tipados al servicio.
4.  **Prisma Layer**: Persiste en PostgreSQL.
5.  **Response**: Retorna objeto creado (Route + Stops).

---
*Última actualización: 13/12/2025*
