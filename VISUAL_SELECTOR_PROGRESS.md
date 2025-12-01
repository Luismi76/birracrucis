# 🗺️ Selector Visual de Bares - Fase 1 Implementada

## ✅ Componente Creado

### BarSearchMap
**Archivo**: `components/BarSearchMap.tsx`

**Características**:
- ✅ Mapa interactivo con Google Maps
- ✅ Círculo mostrando radio de búsqueda
- ✅ Marcador del centro de búsqueda (azul)
- ✅ Marcadores de bares (amarillo = no seleccionado, verde = seleccionado)
- ✅ Números en marcadores seleccionados (1, 2, 3...)
- ✅ Animación bounce en bares seleccionados
- ✅ Click en marcador para seleccionar/deseleccionar
- ✅ Zoom automático según radio

---

## 🎯 Próximos Pasos (Fase 2)

Para completar el selector visual necesitamos:

### 1. Refactorizar `app/routes/new/page.tsx`

**Cambios necesarios**:
- Añadir estado para bares seleccionados (Map o Set)
- Integrar componente `BarSearchMap`
- Añadir checkboxes a la lista de resultados
- Sincronizar selección entre mapa y lista
- Configurar rondas por bar seleccionado

### 2. Layout Propuesto

```
┌─────────────────────────────────┐
│ Crear Birracrucis               │
├─────────────────────────────────┤
│ Nombre: [___]  Fecha: [___]     │
├─────────────────────────────────┤
│ 📍 Ubicación                     │
│ [Usar mi ubicación]             │
│ Lat: [___] Lng: [___]           │
│ Radio: 800m [━━━●━━━]          │
│ [Buscar Bares]                  │
├─────────────────────────────────┤
│ 🗺️ MAPA (400px altura)          │
│ - Círculo de búsqueda           │
│ - Marcadores de bares           │
│ - Click para seleccionar        │
├─────────────────────────────────┤
│ 📋 Bares Encontrados (5)        │
│                                 │
│ ☑ Bar Manolo                    │
│   📍 200m · ⭐ 4.5             │
│   Rondas: [2] Máx: [3]          │
│                                 │
│ ☐ La Cervecería                 │
│   📍 350m · ⭐ 4.2             │
│                                 │
├─────────────────────────────────┤
│ Seleccionados: 2 bares          │
│ [Crear Ruta]                    │
└─────────────────────────────────┘
```

---

## 🔧 Implementación Técnica

### Estado Actual
```typescript
// Actual (individual)
const [stops, setStops] = useState<StopForm[]>([]);
```

### Estado Propuesto
```typescript
// Nuevo (selección múltiple)
type BarSelection = {
  placeId: string;
  bar: PlaceResult;
  plannedRounds: number;
  maxRounds?: number;
};

const [selectedBars, setSelectedBars] = useState<Map<string, BarSelection>>(new Map());
```

### Funciones Clave

```typescript
// Toggle selección
const handleToggleBar = (placeId: string) => {
  setSelectedBars(prev => {
    const newMap = new Map(prev);
    if (newMap.has(placeId)) {
      newMap.delete(placeId);
    } else {
      const bar = places.find(p => p.placeId === placeId);
      if (bar) {
        newMap.set(placeId, {
          placeId,
          bar,
          plannedRounds: 2, // default
          maxRounds: undefined,
        });
      }
    }
    return newMap;
  });
};

// Actualizar rondas
const handleUpdateRounds = (placeId: string, planned: number, max?: number) => {
  setSelectedBars(prev => {
    const newMap = new Map(prev);
    const existing = newMap.get(placeId);
    if (existing) {
      newMap.set(placeId, {
        ...existing,
        plannedRounds: planned,
        maxRounds: max,
      });
    }
    return newMap;
  });
};
```

---

## 📝 Tareas Pendientes

- [ ] Refactorizar estado en `page.tsx`
- [ ] Integrar `BarSearchMap` en layout
- [ ] Añadir checkboxes a lista de resultados
- [ ] Sincronizar selección mapa ↔ lista
- [ ] Inputs para configurar rondas
- [ ] Validación: mínimo 2 bares
- [ ] Botón "Crear Ruta" con bares seleccionados

---

## 🎨 Mejoras Visuales Implementadas

- Marcadores con colores diferenciados
- Números en marcadores seleccionados
- Animación bounce al seleccionar
- Círculo semitransparente para radio
- Zoom automático según radio de búsqueda

---

## 🧪 Cómo Probar (cuando esté integrado)

1. Ir a `/routes/new`
2. Click "Usar mi ubicación"
3. Ajustar radio con slider
4. Click "Buscar Bares"
5. Ver mapa con marcadores
6. Click en marcador → se pone verde y muestra número
7. Click de nuevo → se deselecciona
8. Configurar rondas en lista
9. Click "Crear Ruta"

---

## ⏭️ Siguiente: Integración Completa

¿Quieres que:
- **A)** Refactorice completamente `page.tsx` con el nuevo sistema
- **B)** Hagamos una versión simplificada primero para probar
- **C)** Continuemos con otra funcionalidad

El cambio completo implica reescribir gran parte de la lógica de creación de rutas.
