# ByteREX-Core

Interfaz estática, pública y de código abierto para conversar con ByteREX-Core. El repositorio puede publicarse directamente desde su rama `main` en GitHub Pages. La demo no llama a un proveedor de IA y puede usarse sin una clave.

## Ejecutar localmente

Desde la raíz del repositorio, ejecuta `python3 -m http.server 3000` y abre `http://localhost:3000`. El código publicado está en la raíz (`index.html`, `css/`, `js/`, `favicon.svg`). Las conversaciones demo se guardan en `localStorage` del navegador; no se sincronizan entre dispositivos ni se envían a un servidor.

## Activar GitHub Pages

En GitHub abre **Settings → Pages → Build and deployment**. Elige **Deploy from a branch**, selecciona `main` y la carpeta `/(root)`, y guarda. La publicación desde repositorios públicos está disponible en GitHub Free según la [guía oficial de GitHub Pages](https://docs.github.com/pages/quickstart). La activación de la opción Pages requiere acceso de propietario o administrador del repositorio.

## Observatorio Global

La sección presenta escenarios ficticios para mostrar el formato de análisis consultivo. No usa datos actuales ni fuentes en vivo, no atribuye hechos a países o dirigentes y no envía alertas ni mensajes a gobiernos. Las posibles líneas de trabajo son ilustrativas y no vinculantes; una evaluación real exigiría fuentes verificables, incertidumbre explícita y revisión humana.

El orbe es el foco visual de la portada y abre la sala de conversación al activarlo. Sus capas y órbitas distinguen reposo, procesamiento y respuesta escrita; la intensidad acompaña la longitud de la respuesta. La demo no genera ni reproduce audio y respeta la preferencia de movimiento reducido del dispositivo.

## Integración futura con Venice

GitHub Pages solo sirve archivos estáticos. No debe llamarse a Venice directamente desde el navegador: la clave de Venice quedaría expuesta en el código recibido por los visitantes. La interfaz espera una URL pública de backend en `js/config.js`, en el campo `chatEndpoint`. Esa URL es pública y no debe contener credenciales. El backend debe aceptar `POST` con `{ "message": "…", "history": [...] }` y responder `{ "reply": "…" }`.

El servidor futuro deberá llamar a `POST https://api.venice.ai/api/v1/chat/completions`, enviar la autenticación Bearer con `VENICE_API_KEY` guardada en el gestor de secretos de ese servidor y devolver el texto generado en `reply`. No guardes la clave en Pages, ni siquiera como secreto de GitHub Actions: una clave inyectada en el código que sirve la página sería pública. El backend deberá controlar el acceso, establecer límites de gasto y protegerse contra abuso.

**Costes:** la demo estática y el alojamiento Pages del repositorio público no consumen la API de Venice. La inferencia de Venice se factura por modelo y tokens. La documentación indica que las cuentas Free pueden llamar a la API, pero las solicitudes se cobran con las tarifas publicadas y Free no incluye la asignación mensual de créditos de algunos planes de pago. Por eso, usar Venice no garantiza inferencia real gratuita. Revisa las [tarifas oficiales](https://docs.venice.ai/overview/pricing) antes de activar un endpoint.

Más documentación: [Venice Chat Completions](https://docs.venice.ai/api-reference/endpoint/chat/completions), [guía de seguridad de claves](https://docs.venice.ai/guides/getting-started/generating-api-key).

## Licencia

El código se publica bajo licencia MIT; consulta [`LICENSE`](./LICENSE).
