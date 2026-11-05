# Niveles automáticos de PlopDoku

Este repositorio genera zonas nuevas de PlopDoku **solo**, los días **1 y 15 de cada mes**:

- **Una zona normal** de 20 niveles (10×10, 11×11 o 12×12, alternando).
- **Una zona especial** de 10 niveles cuando se acerca una fecha:
  Año Nuevo, San Valentín, Semana Santa, Día de la Tierra, Independencia (15 de septiembre),
  Día del Niño (1 de octubre), Halloween, Barriletes (1 de noviembre) y Navidad.

Cada nivel tiene una sola solución y se resuelve solo con lógica. El resultado se guarda en
`niveles.json`, que GitHub Pages publica en internet y la app descarga al abrirse.

## Configuración (una sola vez, unos 15 minutos)

1. **Crea una cuenta** en github.com (gratis).
2. **Crea un repositorio público** llamado `plopdoku-niveles`
   (botón **New repository**). Márcalo como *Public*.
3. **Sube los archivos** `generar.js`, `niveles.json` y este `LEEME.md`:
   en el repositorio, **Add file → Upload files**, arrástralos y presiona **Commit changes**.
4. **Crea el flujo automático**: **Add file → Create new file**. En el nombre escribe exactamente
   `.github/workflows/niveles.yml` (las barras crean las carpetas). Pega dentro el contenido del
   archivo `niveles.yml` incluido en el ZIP y presiona **Commit changes**.
5. **Permite que el flujo guarde cambios**: **Settings → Actions → General → Workflow permissions**,
   elige **Read and write permissions** y guarda.
6. **Publica el archivo en internet**: **Settings → Pages**, en *Branch* elige `main` y carpeta
   `/ (root)`, y guarda. En unos minutos tu archivo quedará en:
   `https://TU-USUARIO.github.io/plopdoku-niveles/niveles.json`
7. **Primera generación**: pestaña **Actions → Generar niveles → Run workflow**.
   Tarda entre 5 y 20 minutos. Al terminar, `niveles.json` tendrá la primera zona.
8. **Conecta el juego**: en `plopdoku.html`, busca `NIVELES_URL` y cambia `TU-USUARIO`
   por tu usuario de GitHub.

Listo. A partir de aquí no tienes que hacer nada.

## Mantenimiento

- **Revisa la pestaña Actions de vez en cuando.** Una palomita verde ✅ significa que todo salió bien.
  Si aparece una ✖ roja, GitHub te avisa por correo.
- GitHub puede pausar los flujos programados de repositorios sin actividad durante mucho tiempo.
  Como este flujo guarda cambios cada dos semanas no debería pasar, pero si alguna vez ves el aviso,
  basta con presionar **Enable workflow**.
- **Generar a mano** (por ejemplo, para adelantar una zona): **Actions → Generar niveles → Run workflow**.

## Personalizar (opcional)

Todo está al inicio de `generar.js`:

- `NIVELES_ZONA_NORMAL` y `TAMANOS_NORMALES`: cuántos niveles y de qué tamaño.
- `ZONAS_NORMALES`: nombres, emoji y decoraciones de las zonas (se usan en orden).
- Cada zona normal y cada evento tiene su `premio` (un popó con sombrero, un efecto o un estilo de tablero). El sombrero puede ser cualquier emoji.
- `EVENTOS`: fechas especiales. Para agregar una, copia una línea y cambia el `id`, el nombre y la fecha.

La app **valida** todo lo que descarga: si un nivel viene dañado o tiene más de una solución,
lo ignora. Si no hay internet, se juega con lo último que se descargó.


© 2026 Boris Tení. Todos los derechos reservados. Este código y los niveles generados son parte del juego PlopDoku y no pueden reutilizarse sin permiso.
