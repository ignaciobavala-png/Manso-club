# docs

## guia-campanas-mail.html

Fuente de la guía que se le pasa a diseño y a quien manda las campañas
(especificaciones de entrega del material + paso a paso del editor de mailing).

Para regenerar el PDF:

```bash
google-chrome --headless --no-pdf-header-footer \
  --print-to-pdf="Manso Club - Guia de campanas de mail.pdf" \
  "file://$PWD/docs/guia-campanas-mail.html"
```

Mantenerla al día cuando cambie el editor de mailing: si la guía dice algo que
la pantalla ya no hace, es peor que no tenerla.
