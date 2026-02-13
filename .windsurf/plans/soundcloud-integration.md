# Integración de SoundCloud para Artistas

Plan para integrar SoundCloud en la sección de artistas de Manso Club, permitiendo que cada artista tenga su propia playlist configurable y un reproductor integrado en su perfil.

## Análisis Actual

El sistema ya tiene soporte básico para SoundCloud:
- La tabla `artistas` incluye un campo `redes_sociales.soundcloud` para URLs
- El formulario de administración ya tiene un campo para SoundCloud
- La página de artistas muestra un enlace externo a SoundCloud

## Objetivo

Transformar el simple enlace externo en una experiencia integrada donde:
1. Cada artista pueda tener una playlist de SoundCloud configurable
2. Los usuarios puedan escuchar la música directamente desde la página del artista
3. El reproductor esté integrado visualmente con el diseño de Manso Club

## Implementación Propuesta

### 1. Componente de Reproductor SoundCloud
- Crear `components/SoundCloudPlayer.tsx`
- Usar el Widget API de SoundCloud (iframe + JavaScript API)
- Diseño personalizado que coincida con la estética Manso Club
- Controles personalizados con estilo consistente

### 2. Modal/Overlay de Perfil de Artista
- Modificar la tarjeta de artista actual para abrir un modal en lugar de solo mostrar overlay
- El modal contendrá:
  - Foto grande del artista
  - Biografía completa
  - Reproductor de SoundCloud integrado
  - Enlaces a redes sociales
  - Lista de eventos próximos (si aplica)

### 3. Actualización de Base de Datos
- Mantener el campo actual `soundcloud` en `redes_sociales`
- El campo aceptará URLs de:
  - Perfiles de SoundCloud
  - Playlists específicas
  - Tracks individuales

### 4. Lógica de Detección de URL
- Función para detectar el tipo de URL (perfil, playlist, track)
- Adaptar el reproductor según el tipo de contenido
- Manejo de errores para URLs inválidas

### 5. Mejoras al Formulario de Administración
- Mejorar el campo de SoundCloud para indicar qué tipos de URLs se pueden usar
- Vista previa del reproductor al ingresar la URL
- Validación de URLs de SoundCloud

## Características Técnicas

### Widget API Integration
```javascript
// Script necesario: https://w.soundcloud.com/player/api.js
SC.Widget(iframeElement).play();
SC.Widget(iframeElement).pause();
SC.Widget(iframeElement).setVolume(50);
```

### URL Formats Soportados
- Perfil: `https://soundcloud.com/username`
- Playlist: `https://soundcloud.com/username/sets/playlist-name`
- Track: `https://soundcloud.com/username/track-name`

### Estilo Personalizado
- Colores Manso Club (cream, terra, black)
- Controles customizados
- Responsive design
- Animaciones sutiles

## Beneficios

1. **Experiencia Integrada**: Los usuarios no abandonan el sitio para escuchar música
2. **Profesionalismo**: Mejora la percepción del club como plataforma musical seria
3. **Engagement**: Aumenta el tiempo de permanencia en el sitio
4. **Flexibilidad**: Cada artista tiene control sobre su contenido musical

## Consideraciones

- El Widget API de SoundCloud es gratuito y no requiere autenticación
- El reproductor respeta los derechos de autor de SoundCloud
- Se mantiene la compatibilidad con URLs existentes
- El diseño es responsive y funciona en móviles

## Próximos Pasos

1. Crear componente SoundCloudPlayer
2. Implementar modal de perfil de artista
3. Actualizar página de artistas
4. Mejorar formulario de administración
5. Testing y optimización
