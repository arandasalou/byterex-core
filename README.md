# ByteREX-Core

Interfaz estática pública del **Observatorio Global ByteREX-Core**, con identidad visual de Archivo Cretácico. El orbe central es el acceso práctico a la conversación; GitHub Pages publica los archivos de este repositorio desde `main` y `/`.

- **Sitio público:** https://arandasalou.github.io/byterex-core/
- **API pública de noticias:** https://byterex-ilbi3cja.manus.space
- **Estado de la API:** `/api/status`
- **Archivo de noticias:** `/api/news`

GitHub Pages ya está configurado para `main` y la raíz del repositorio. `js/config.js` contiene únicamente el origen público del API; no incluye claves ni credenciales.

## Observatorio Global

El panel consulta noticias reales del API y muestra su fuente, idioma, fecha, tema, enlace original y el estado de las fuentes. La primera recolección guardó 76 elementos: 30 de WHO en inglés, 25 de WHO en español y 21 de FAO Newsroom. Esa ejecución fue parcial: UN News y GDELT devolvieron errores de red; una consulta preliminar de GDELT había recibido HTTP 429. El estado más reciente se obtiene de `/api/status`; los fallos no se sustituyen por escenarios inventados.

El piloto usa GDELT y feeds RSS de WHO (inglés y español), FAO Newsroom y UN News. Hay una tarea de recolección configurada cada hora UTC. Solo se archivan metadatos, enlaces y extractos cortos del feed (hasta 500 caracteres), no artículos completos.

**Límites:** no usa X/Twitter, no descarga artículos completos, no entrena ni ajusta modelos y no envía avisos o instrucciones a gobiernos. Es un observatorio consultivo: los registros requieren verificación humana y no son alertas oficiales, predicciones ni decisiones autónomas.

## Conversación y privacidad

La conversación sigue en modo de demostración local: no está conectada a Venice ni a otro modelo remoto y el historial demo se guarda en el navegador. No hay claves de proveedor en este repositorio. GitHub Pages sirve archivos públicos estáticos; una clave incorporada al frontend dejaría de ser secreta.

Para ver el diseño localmente, ejecuta `python3 -m http.server 3000` desde la raíz y abre `http://localhost:3000`. Por seguridad, el API permite CORS al origen de GitHub Pages; la copia local podrá mostrar la interfaz, pero no consultar el API desde `localhost`.

## Fuentes

- [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)
- [WHO RSS en inglés](https://www.who.int/rss-feeds/news-english.xml) y [en español](https://www.who.int/rss-feeds/news-spanish.xml)
- [FAO Newsroom RSS](https://www.fao.org/feeds/fao-newsroom-rss)
- [UN News Top Stories RSS](https://news.un.org/feed/subscribe/en/news/all/rss.xml)

El sitio estático puede alojarse en GitHub Pages Free para un repositorio público; los límites o cuotas del backend dependen del plan de WebDev y no se promete uso ilimitado ni coste cero para los servicios de terceros.

## Licencia

MIT. Consulta [`LICENSE`](./LICENSE).
