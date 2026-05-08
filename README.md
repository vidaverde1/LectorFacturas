# Lector de Facturas

Convertí cualquier factura o albarán en un archivo Excel estructurado en segundos. Fotografiá el documento con tu celular, subí un PDF o una imagen, y la IA extrae automáticamente los artículos, cantidades y precios sin IVA.

---

## Características

- **Captura con cámara** — Tomá la foto directamente desde el navegador, sin apps adicionales
- **Drag & drop** — Arrastrá un PDF, JPG o PNG al área de carga
- **Extracción con IA** — Llama 4 Scout (Groq) analiza el documento y detecta todos los artículos
- **Cálculo de IVA inverso** — Si el precio incluye IVA, la app calcula automáticamente el neto (tasas AR: 21%, 10,5%, 27%)
- **Descarga en Excel** — Un clic genera el `.xlsx` listo para importar a cualquier sistema
- **Mobile first** — Diseñado para usarse desde el celular en el depósito o mostrador

## Columnas exportadas

| Columna | Descripción |
|---|---|
| Código de barras | EAN-13 / EAN-8 si figura en el documento |
| Artículo | Descripción completa del producto |
| Cantidad | Unidades (entero) |
| Precio sin IVA | Precio unitario neto en pesos argentinos |
| Subtotal | Cantidad × Precio sin IVA |

---

## Stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router)
- **UI** — [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **IA** — [Groq](https://groq.com) con `meta-llama/llama-4-scout-17b-16e-instruct`
- **PDF** — `pdf-parse` para extracción de texto en PDFs digitales
- **Excel** — `xlsx` (SheetJS) para generación en el navegador
- **Formularios** — `react-hook-form` + `zod`

---

## Instalación

### 1. Cloná el repositorio

```bash
git clone https://github.com/tu-usuario/lector-facturas.git
cd lector-facturas
```

### 2. Instalá las dependencias

```bash
npm install
```

### 3. Configurá las variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```env
GROQ_API_KEY=gsk_...
```

Obtenés tu API key gratuita en [console.groq.com](https://console.groq.com) → API Keys → Create API Key. No requiere tarjeta de crédito.

### 4. Iniciá el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Uso

1. **Desde el celular** — Tocá "Fotografiar documento" y apuntá la cámara a la factura
2. **Desde la PC** — Arrastrá el archivo al área de carga o hacé clic para seleccionarlo
3. Esperá unos segundos mientras la IA procesa el documento
4. Revisá los artículos extraídos en pantalla
5. Tocá **Excel** para descargar el archivo

### Formatos soportados

| Formato | Soporte |
|---|---|
| JPG / PNG | Completo (visión por IA) |
| PDF digital | Completo (extracción de texto) |
| PDF escaneado | Convertir a JPG/PNG antes de subir |

---

## Límites del plan gratuito de Groq

| Métrica | Límite |
|---|---|
| Solicitudes por minuto | 30 |
| Tokens por día | 500.000 |
| Costo | $0 |

Para uso intensivo, Groq ofrece planes de pago con límites mucho mayores.

---

## Desarrollo

```bash
npm run dev      # Servidor de desarrollo con hot reload
npm run build    # Build de producción
npm run lint     # Linter
```

---

## Licencia

MIT
