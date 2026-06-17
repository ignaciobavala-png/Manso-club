# Niveles de acceso — arquitectura central

## Los tres niveles

| Nivel | Quién | Qué ve |
|---|---|---|
| **Público** | Cualquier visitante, sin cuenta | Todo lo que hoy es la página pública: home, artistas, agenda, tienda, about |
| **Registrado** | Tiene cuenta gratuita | Contenido extendido — sets de artistas, streaming general, contenido extra que recompensa el registro |
| **Miembro** | Pagó membresía | Contenido exclusivo — eventos especiales, masterclasses, talleres, lo que la comunidad financia |

## Principio clave

> Registrarse ya tiene valor real. No es un paso burocrático, es una recompensa.

El registrado accede a cosas genuinamente buenas (los sets de Ana, el streaming general).
Esto hace que el registro tenga sentido por sí solo y que el funnel hacia membresía
parta desde alguien que ya está dentro y ya confía en Manso.

## Cómo se implementa en código

Cada página o sección evalúa en este orden:

```
¿Hay sesión?
  No  → experiencia pública
  Sí  → ¿tiene membresía activa?
          No  → experiencia registrado (contenido extendido)
          Sí  → experiencia miembro (contenido exclusivo)
```

En la DB, `user_profiles` ya existe. Solo necesita un campo `membresia_activa` (boolean
o fecha de vencimiento) que el admin activa manualmente por ahora.

## Señalización en la UI

El usuario siempre tiene que saber qué se está perdiendo y cómo desbloquearlo:

- Contenido de miembro visible para registrados → badge "Solo miembros" + CTA a membresías
- Contenido extendido visible para público → bloque sutil "Registrate gratis para acceder"
- Nunca ocultar completamente — siempre mostrar que existe algo más

## Aplicación por sección

| Sección | Público | Registrado | Miembro |
|---|---|---|---|
| Home, About, Agenda, Tienda | ✅ completo | ✅ completo | ✅ completo |
| Artistas (perfil) | ✅ bio + tracks | ✅ + sets completos | ✅ + contenido especial |
| Streaming general | preview / trailer | ✅ acceso completo | ✅ acceso completo |
| Streaming exclusivo | ❌ bloqueado | 🔒 visible, no accesible | ✅ desbloqueado |
| Eventos especiales | info pública | 🔒 visible, no accesible | ✅ desbloqueado |

## Estado

- [x] Decisión tomada — 3 niveles: público / registrado / miembro
- [ ] Verificar campo `membresia_activa` o equivalente en `user_profiles`
- [ ] Implementar lógica de nivel en `/artistas/[slug]` (primer caso concreto)
- [ ] Definir qué contenido de streaming es "extendido" vs "exclusivo"
