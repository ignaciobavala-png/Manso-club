# Neue Montreal

El título del banner del home usa **Neue Montreal** (Pangram Pangram, licencia
paga). Los archivos no están en el repo: hay que comprarlos y dejarlos acá con
estos nombres exactos, que son los que declara `app/globals.css`:

- `NeueMontreal-Regular.woff2`
- `NeueMontreal-Medium.woff2`
- `NeueMontreal-Bold.woff2`
- `NeueMontreal-Italic.woff2`

Mientras falten, el `@font-face` cae al stack de Helvetica Neue y el hero se ve
igual que antes en tamaño y posición, sólo que con la otra tipografía. No rompe
nada ni tira 404 bloqueantes.

Si sólo hay `.otf` / `.ttf`, convertirlos a woff2 (por ejemplo con
`fonttools`: `pyftsubset font.otf --flavor=woff2 --output-file=font.woff2`)
antes de subirlos: pesan menos de la mitad.
