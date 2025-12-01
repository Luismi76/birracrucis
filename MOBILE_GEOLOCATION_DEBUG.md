# 🔧 Guía de Diagnóstico: Geolocalización en Móvil

## ❓ Posibles Causas

### 1. **Problema de HTTPS** (MÁS COMÚN)

La API de geolocalización **requiere HTTPS** en navegadores modernos (excepto localhost).

**Cómo verificar**:
- Mira la URL en el navegador del móvil
- Si empieza con `http://` (no `https://`) → **Este es el problema**

**Solución**:
```bash
# Opción 1: Usar ngrok para HTTPS temporal
npx ngrok http 3000

# Opción 2: Configurar HTTPS en Next.js (desarrollo)
# Crear certificado local y configurar
```

---

### 2. **Permisos Denegados**

El navegador puede estar bloqueando el acceso a la ubicación.

**Cómo verificar**:
1. Abre la consola del navegador en el móvil
2. Busca mensajes de error
3. Revisa los permisos del sitio en configuración del navegador

**Solución**:
1. En Chrome móvil: Menú → Configuración → Configuración del sitio → Ubicación
2. Asegúrate de que el sitio tenga permiso
3. Recarga la página y vuelve a intentar

---

### 3. **GPS Desactivado**

El GPS del móvil puede estar desactivado.

**Solución**:
1. Configuración → Ubicación
2. Activa "Ubicación" o "GPS"
3. Asegúrate de que esté en modo "Alta precisión"

---

### 4. **Navegador No Compatible**

Algunos navegadores móviles antiguos no soportan geolocalización.

**Solución**:
- Usa Chrome, Safari, o Firefox actualizados

---

## 🧪 Cómo Diagnosticar

### Paso 1: Verificar Consola

1. En Chrome móvil: Menú → Más herramientas → Herramientas para desarrolladores
2. O conecta el móvil al PC y usa Chrome DevTools remoto

Busca estos mensajes:
- `📍 Solicitando ubicación...` → La solicitud se envió
- `✅ Ubicación obtenida` → Funciona correctamente
- `❌ Error de geolocalización` → Hay un problema
- `⚠️ La página no está en HTTPS` → Necesitas HTTPS

### Paso 2: Verificar URL

**Problema**: `http://192.168.1.X:3000` ❌
**Solución**: Necesitas HTTPS

**OK**: `https://tu-dominio.com` ✅
**OK**: `http://localhost:3000` ✅ (solo en desarrollo local)

### Paso 3: Probar Permisos

1. Haz clic en "Usar mi ubicación (una vez)"
2. Debe aparecer un popup pidiendo permiso
3. Si no aparece → Los permisos están bloqueados

---

## ✅ Soluciones Rápidas

### Solución 1: Usar ngrok (RECOMENDADO)

```bash
# Instalar ngrok
npm install -g ngrok

# Iniciar tu app
npm run dev

# En otra terminal, crear túnel HTTPS
ngrok http 3000
```

Ngrok te dará una URL HTTPS como: `https://abc123.ngrok.io`

Abre esa URL en tu móvil y funcionará.

### Solución 2: Usar Simulación

Mientras solucionas el problema de HTTPS:
1. Usa los botones "📍 Simular aquí" en cada bar
2. O introduce coordenadas manualmente

### Solución 3: Configurar HTTPS Local

```bash
# Instalar mkcert
npm install -g mkcert

# Crear certificado
mkcert -install
mkcert localhost 192.168.1.X

# Configurar Next.js para usar HTTPS
# (requiere configuración adicional)
```

---

## 📱 Información Adicional

### Mensajes de Error Mejorados

He actualizado el código para mostrar mensajes más claros:

- **Permiso denegado**: "❌ Permiso denegado. Por favor, permite el acceso..."
- **GPS desactivado**: "❌ Ubicación no disponible. Asegúrate de tener el GPS activado."
- **Timeout**: "⏱️ Tiempo de espera agotado. Inténtalo de nuevo."
- **Sin HTTPS**: "⚠️ IMPORTANTE: La geolocalización requiere HTTPS..."

### Logging en Consola

Ahora verás en la consola:
```
📍 Solicitando ubicación...
✅ Ubicación obtenida: { lat: 37.778, lng: -5.388, accuracy: 12 }
```

O si hay error:
```
❌ Error de geolocalización: GeolocationPositionError
⚠️ La página no está en HTTPS
```

---

## 🎯 Próximos Pasos

1. **Verifica la URL**: ¿Es HTTPS?
2. **Usa ngrok** si no tienes HTTPS
3. **Revisa la consola** del navegador móvil
4. **Prueba los permisos** del navegador
5. **Usa simulación** como alternativa temporal
