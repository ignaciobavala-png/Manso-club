# Canal 24/7 con chat en `/streaming` — plan

> Estado: **propuesta, sin empezar.** Pendiente de aprobación de la org (22/11/2026).
> No hay código ni migraciones hechas todavía.

## Idea

Hoy la sección LIVE (`/streaming`) pasa **un solo video en loop** elegido desde el
dash, o un stream en vivo. La propuesta es que funcione como un canal de TV:
los videos cargados en el dash se pasan **uno tras otro sin corte**, y abajo del
player va una **caja de chat** reutilizando el chat de `/mansochat`, que nunca se
promocionó.

## Decisiones tomadas

- **Origen de los videos: el dashboard** (`streaming_contenido`), en el orden que
  se defina ahí. No el canal de YouTube entero ni una playlist de YouTube.
- **Chat: sala propia "Live", visible para todos.** Cualquiera lee; para
  escribir hay que loguearse (empuja registros).

## Cómo está hoy

- `app/streaming/page.tsx` lee `streaming_config` (`modo`, `stream_url`,
  `contenido_id`) y se lo pasa a `StreamingLibrary.tsx` → `CanalPlayer`.
- Modos actuales: `en_vivo` (URL de stream), `grabado` (un video en loop),
  `apagado`. Se manejan desde `components/admin/CanalControl.tsx`.
- Los videos tienen `youtube_video_id`, `orden`, `visibilidad` y
  `duracion_minutos` (no alcanza para sincronizar).
- Chat: `components/Chat/*`, `hooks/useChat.ts` (Realtime). `Conversacion` recibe
  una `ChatConversacion` y funciona sola. RLS en `supabase/migration_chat*.sql`:
  leer y escribir requieren `authenticated` + `chat_es_miembro()`.

## Plan

### 1. Programación tipo TV
- Columnas nuevas en `streaming_contenido`:
  - `en_canal boolean default true` — switch "pasar en el canal".
  - `duracion_segundos int` — duración exacta, necesaria para sincronizar.
- La duración se completa sola: al pegar el ID de YouTube en
  `FormStreamingContenido`, un player oculto de la IFrame API devuelve
  `getDuration()`. Para lo ya cargado, botón "completar duraciones" en
  `CanalControl`.
- Sincronía: con una hora de inicio fija (epoch), `offset = (ahora - epoch) mod
  duración_total` → qué video va y en qué segundo. Todos ven lo mismo al mismo
  tiempo, lo que le da sentido al chat. Al terminar un video arranca el
  siguiente (`onEnded`); al final de la lista vuelve a empezar.
- Solo entran videos con `visibilidad = 'publico'` y `en_canal = true`.

### 2. Dashboard
- Modo nuevo en `streaming_config.modo`: **`canal`** ("Canal 24/7"), junto a
  en vivo / grabado / apagado. Revisar si hay un CHECK sobre `modo`.
- `en_vivo` sigue pisando todo cuando hay stream real.

### 3. Chat abajo del player
- Sala "Live" fija en `chat_salas` (definir si es un `tipo` nuevo o una columna
  `es_live`; ojo con los CHECK / usos de `tipo` en el código).
- Policy de SELECT para `anon` en `chat_mensajes` (y lo necesario de
  `chat_salas`/reacciones) **solo para esa sala**. DMs y demás salas siguen
  cerradas. Verificar que Realtime respete la policy para anon.
- Sin login: se ven los mensajes + botón "Entrá para chatear" (→ `/login`).
- Revisar en `Conversacion` las acciones que asumen usuario (salir, eliminar,
  menú) para la variante embebida.

## A tener en cuenta
- **Autoplay arranca muteado**: los navegadores no permiten audio sin
  interacción. Botón grande "Activar sonido".
- La migración va en `supabase/` como siempre y se corre en el SQL Editor.

## Orden de trabajo
1. Migración (columnas, modo `canal`, sala Live, policy anon).
2. Dash: switch + duración automática + modo nuevo en `CanalControl`.
3. Player 24/7 en `StreamingLibrary` (IFrame API, cálculo de offset).
4. Chat embebido debajo.
5. Probar con `pnpm dev` antes de commitear.
