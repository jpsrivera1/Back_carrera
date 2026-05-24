# Backend — Control de Inscripciones Carrera 5K / 10K

API REST desarrollada con Node.js, Express y PostgreSQL para gestionar el registro de participantes, pagos y entrega de kits de una carrera 5K y 10K.

---

## Requisitos previos

- Node.js v18 o superior
- PostgreSQL con la base de datos `carrera_5k_10k` ya creada
- npm

---

## Instalación

```bash
# Clona o descarga el proyecto y entra a la carpeta
cd Backend_carrera

# Instala las dependencias
npm install
```

---

## Configuración del archivo .env

Copia `.env.example` a `.env` y ajusta los valores según tu entorno:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carrera_5k_10k
DB_USER=postgres
DB_PASSWORD=tu_password
DB_SSL=false
FRONTEND_URL=http://localhost:5173
```

---

## Ejecutar en desarrollo

```bash
npm run dev
```

El servidor quedará disponible en `http://localhost:3000`.

---

## Lista de Endpoints

### PARTICIPANTES

| Método | Ruta                                  | Descripción                              |
|--------|---------------------------------------|------------------------------------------|
| GET    | /api/participantes                    | Listar todos los participantes           |
| GET    | /api/participantes/:id                | Obtener participante por ID              |
| POST   | /api/participantes                    | Registrar nuevo participante             |
| PUT    | /api/participantes/:id                | Actualizar datos del participante        |
| DELETE | /api/participantes/:id                | Cancelar participante (estado Cancelado) |
| GET    | /api/participantes/buscar/:termino    | Buscar por nombre o número de corredor   |

### PAGOS

| Método | Ruta                          | Descripción                          |
|--------|-------------------------------|--------------------------------------|
| GET    | /api/pagos                    | Listar todos los pagos               |
| GET    | /api/pagos/pendientes         | Listar pagos pendientes              |
| GET    | /api/pagos/pagados            | Listar pagos completados             |
| PUT    | /api/pagos/:participante_id   | Actualizar pago de un participante   |

### KITS

| Método | Ruta                                        | Descripción                     |
|--------|---------------------------------------------|---------------------------------|
| GET    | /api/kits                                   | Listar todos los kits           |
| GET    | /api/kits/pendientes                        | Listar kits pendientes          |
| GET    | /api/kits/entregados                        | Listar kits entregados          |
| PUT    | /api/kits/:participante_id/entregar         | Marcar kit como entregado       |
| PUT    | /api/kits/:participante_id/revertir         | Revertir entrega del kit        |

### DASHBOARD

| Método | Ruta                        | Descripción                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/dashboard              | Resumen general (vista_dashboard)    |
| GET    | /api/dashboard/tallas       | Resumen por talla de T-shirt         |
| GET    | /api/dashboard/categorias   | Resumen por categoría 5K / 10K       |

---

## Ejemplos de body

### Registrar participante

```json
POST /api/participantes
{
  "nombre_completo": "Juan Pérez",
  "categoria": "5K",
  "talla_tshirt": "M"
}
```

### Actualizar pago

```json
PUT /api/pagos/1
{
  "monto": 75.00,
  "metodo_pago": "Efectivo",
  "estado_pago": "Pagado",
  "observacion": "Pago completo"
}
```

### Marcar kit como entregado

```json
PUT /api/kits/1/entregar
{
  "observacion": "Entregado en stand principal"
}
```

---

## Valores válidos

| Campo         | Valores permitidos                          |
|---------------|---------------------------------------------|
| categoria     | `5K`, `10K`                                 |
| talla_tshirt  | `XS`, `S`, `M`, `L`, `XL`, `XXL`           |
| metodo_pago   | `Efectivo`, `Transferencia`                 |
| estado_pago   | `Pendiente`, `Pagado`, `Anulado`            |
| estado        | `Activo`, `Cancelado`                       |

---

## Formato de respuesta

**Éxito:**
```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## Conectar con React (Axios)

Instala Axios en tu proyecto React:

```bash
npm install axios
```

Crea un archivo `src/api/axiosClient.js`:

```js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosClient;
```

Ejemplo de uso en un componente:

```js
import axiosClient from '../api/axiosClient';

const fetchParticipantes = async () => {
  const { data } = await axiosClient.get('/participantes');
  if (data.success) {
    setParticipantes(data.data);
  }
};
```

---

## Estructura del proyecto

```
src/
├── config/
│   └── db.js                        # Pool de conexión a PostgreSQL
├── controllers/
│   ├── participantes.controller.js
│   ├── pagos.controller.js
│   ├── kits.controller.js
│   └── dashboard.controller.js
├── routes/
│   ├── participantes.routes.js
│   ├── pagos.routes.js
│   ├── kits.routes.js
│   └── dashboard.routes.js
├── services/
│   ├── participantes.service.js
│   ├── pagos.service.js
│   ├── kits.service.js
│   └── dashboard.service.js
├── middlewares/
│   └── error.middleware.js
├── app.js
└── server.js
```
