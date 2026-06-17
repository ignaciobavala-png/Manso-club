# Reproductor Global — GlobalMusicPlayer

**Archivos fuente:**
- GlobalMusicPlayer: `components/Layout/GlobalMusicPlayer.tsx:1-364`
- Desktop player: `components/Home/HomeMusicPlayer.tsx`
- Track manager: `components/artistas/ArtistTrackManager.tsx`
- Root layout: `app/layout.tsx:88` (donde se monta)

## La idea

Reproductor de música ambiente que recorre todo el sitio. Flota en la parte inferior en desktop y como barra compacta en mobile. Cambia automáticamente al SoundCloud de un artista cuando el usuario entra a su perfil.

## Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Posición | Desktop: `fixed bottom-0 z-40`. Mobile: `fixed bottom-0 z-30` |
| SDK | SoundCloud Widget API (`w.soundcloud.com/player/api.js`) |

## Fuentes de música

### 1. Música principal (`main_music`)

```typescript
// components/Layout/GlobalMusicPlayer.tsx:37-58
SELECT id, titulo, artista, soundcloud_url
FROM main_music WHERE active = true ORDER BY orden
```

Se fetchea al montar. Es la música por defecto en todo el sitio.

### 2. Override de artista

```typescript
// components/Layout/GlobalMusicPlayer.tsx:215-231
window.addEventListener('globalPlayer:artistOverride', ...)
window.addEventListener('globalPlayer:clearOverride', ...)
```

Cuando un usuario entra a `/artistas/[slug]`:
1. `ArtistTrackManager` dispara `globalPlayer:artistOverride` con `{ artistName, soundcloud_url }`
2. El reproductor global cambia al SoundCloud del artista
3. Al salir de la página, `ArtistTrackManager` dispara `globalPlayer:clearOverride`
4. El reproductor vuelve a `main_music`

### Cuándo se oculta

```typescript
// components/Layout/GlobalMusicPlayer.tsx:266-268
if (pathname && pathname.startsWith('/artistas/')) return null;
```

En páginas de artista, el reproductor global se oculta completamente — el perfil del artista tiene su propio `ArtistProfilePlayer`.

## Desktop: HomeMusicPlayer

```typescript
// components/Layout/GlobalMusicPlayer.tsx:354-361
<HomeMusicPlayer
  tracks={tracks}
  autoPlay={false}
  isArtistMode={!!artistOverride}
  onPlayStateChange={(playing) => setIsPlaying(playing)}
/>
```

- Se renderiza dentro de un contenedor con animación `translate-y` (aparece/desaparece con scroll)
- Taskbar inferior con controles de play/pause, skip, volumen

### Scroll behavior (desktop)

```typescript
// components/Layout/GlobalMusicPlayer.tsx:174-186
scroll down → hide (translate-y-full)
scroll up   → show (translate-y-0)
scroll < 50 → always show
```

## Mobile: barra compacta

```typescript
// components/Layout/GlobalMusicPlayer.tsx:287-338
```

- Barra fija abajo, ancho completo
- Botón play/pause circular (`bg-manso-terra`)
- Info del track: título + artista
- Indicador de estado: punto verde pulsante si está sonando
- Scroll behavior: mismo patrón que desktop

### Dynamic padding

```typescript
// components/Layout/GlobalMusicPlayer.tsx:252-261
if (isMobileView) {
  document.body.style.paddingBottom = showMobileBar ? '56px' : '0px';
}
```

Agrega padding al body para que la barra no tape contenido.

## SoundCloud Widget

### Inicialización

```typescript
// components/Layout/GlobalMusicPlayer.tsx:71-83
// Carga el SDK de SoundCloud dinámicamente
const script = document.createElement('script');
script.src = 'https://w.soundcloud.com/player/api.js';
```

### Widget API

- `SC.Widget(iframe)` — crea el widget
- `widget.load(url, { auto_play: false, show_artwork: false })` — carga un track
- `widget.play()` / `widget.pause()` — control
- `widget.setVolume(50)` — volumen al 50%
- Eventos: `READY`, `PLAY`, `PAUSE`, `ERROR`

### iframe oculto (mobile)

```typescript
// components/Layout/GlobalMusicPlayer.tsx:201-212
getEmbedUrl(scUrl):
  https://w.soundcloud.com/player/?
    url=SC_URL
    &auto_play=false
    &hide_related=true
    &show_comments=false
    &show_user=false
    &show_reposts=false
    &visual=false
```

En mobile, el iframe de SoundCloud está oculto (`hidden`). Solo se usa como fuente de audio.

## DB involucrada

| Tabla | Operación |
|-------|-----------|
| `main_music` | SELECT (active = true, orden) |

## Relación con otros docs

- La integración con artistas — `paginas/artistas.md`
- El track manager del artista — `components/artistas/ArtistTrackManager.tsx`
