# Frontend de Pruebas - Suscripciones MercadoPago

## Estructura de Archivos

```
frontend/
├── index.html          # Interfaz principal
├── styles.css          # Estilos CSS
├── main.js            # Lógica JavaScript
└── config.js          # Configuración de entorno
```

## Configuración

### 1. Variables de Entorno (config.js)

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',
    MERCADOPAGO_PUBLIC_KEY: 'TEST-your-public-key',
    ENVIRONMENT: 'development'
};
```

### 2. Obtener Public Key de MercadoPago

1. Acceder a https://www.mercadopago.com.mx/developers
2. Ir a "Tus aplicaciones" > "Crear aplicación"
3. Seleccionar "Pagos online y presenciales"
4. Copiar "Public Key" de modo TEST
5. Actualizar `MERCADOPAGO_PUBLIC_KEY` en config.js

### 3. Backend (.env)

```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token
MERCADOPAGO_API_URL=https://api.mercadopago.com
APP_DOMAIN=http://localhost:8000
```

## Uso

### Paso 1: Cargar Planes

**Token de plataforma (sin hashear):**
- `inventix_secure_token_2025`
- `shopix_secure_token_2025`
- `emitex_secure_token_2025`

1. Ingresar token
2. Clic en "Cargar Planes"
3. Seleccionar plan de la lista

### Paso 2: Crear Cuenta

1. Store UUID: generar UUID válido
2. Store Name: nombre de tienda
3. Plan UUID: auto-completado
4. Crear cuenta
5. Copiar `api_token` generado

### Paso 3: Crear Suscripción

1. API Token: del paso 2
2. Tenant ID: mismo store_uuid del paso 2
3. Plan UUID: auto-completado
4. Customer Email: email válido
5. Crear suscripción

**Respuesta exitosa:**
```json
{
  "subscription_id": "uuid-subscription",
  "init_point": "https://www.mercadopago.com.mx/subscriptions/...",
  "status": "pending"
}
```

### Paso 4: Completar Pago en MercadoPago

El frontend mostrará:
- Link directo al checkout de MercadoPago
- Botón "Pagar con MercadoPago"

**Tarjetas de prueba:**
```
APPROVED: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
```

### Paso 5: Webhook (Opcional para desarrollo local)

```bash
ngrok http 8000
```

Configurar webhook en MercadoPago:
```
https://your-ngrok-url.ngrok.io/webhooks/payment-providers/mercadopago
```

### Paso 6: Gestionar Suscripción

1. Subscription UUID: del paso 3
2. Seleccionar acción (cancelar/pausar/reanudar)
3. Ejecutar

## SDK de MercadoPago

El frontend integra el SDK oficial:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

**Funcionalidades:**
- Renderizado de botón de pago
- Redirección segura a checkout
- Procesamiento de respuestas

## Endpoints Backend

```
GET    /platforms/{token}/plans
POST   /commercial/accounts
POST   /commercial/subscriptions
PATCH  /commercial/subscriptions/{uuid}/cancel
PATCH  /commercial/subscriptions/{uuid}/pause
PATCH  /commercial/subscriptions/{uuid}/resume
POST   /webhooks/payment-providers/mercadopago
```

## Flujo Completo

```
1. Frontend → Backend: Obtener planes
2. Frontend → Backend: Crear cuenta
3. Frontend → Backend: Crear suscripción
4. Backend → MercadoPago: Crear preapproval
5. MercadoPago → Frontend: Init point URL
6. Usuario → MercadoPago: Completar pago
7. MercadoPago → Backend: Webhook notificación
8. Backend → DB: Actualizar estado suscripción
```

## Troubleshooting

### Error: CORS
Agregar en backend:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error: SDK no carga
Verificar:
- Conexión a internet
- Public Key válida en config.js
- Consola del navegador para errores

### Error: Webhook no llega
- Usar ngrok para desarrollo local
- Verificar URL en panel de MercadoPago
- Revisar logs de ngrok: `ngrok http 8000 --log stdout`

## Testing sin MercadoPago Real

Modificar `main.js`:

```javascript
async function createSubscription() {
    const mockResponse = {
        data: {
            subscription_id: "mock-uuid",
            init_point: "https://example.com/mock",
            status: "pending"
        }
    };
    
    showResponse(responseDiv, 'success', JSON.stringify(mockResponse, null, 2));
}
```

## Estados de Suscripción

| Estado | Descripción |
|--------|-------------|
| pending | Creada, esperando pago |
| active | Activa y pagada |
| past_due | Pago vencido |
| paused | Pausada por usuario |
| cancelled | Cancelada |