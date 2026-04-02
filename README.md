# enece-sa.com

Sitio web estatico corporativo de ENECE S.A., enfocado en la empresa, productos, presencia internacional, Instagram y contacto comercial.

## Contenido

- `index.html`: home principal en espaniol.
- `enece-ingles.html`, `enece-portuguese.html`: variantes por idioma.
- `assets/`: CSS, JS e iconos del sitio.
- `CNAME`, `sitemap.xml`: configuracion de dominio y SEO.
- imagenes y videos de cultivo, producto e institucionales en la raiz.

## Secciones principales

- hero con slider visual
- presentacion de la empresa
- productos
- historia y trayectoria
- feed de Instagram
- ubicacion y formulario de contacto

## Stack

- HTML estatico
- CSS y JS locales en `assets/`
- widget externo de RSS/App para Instagram
- Google Maps embed

No hay build ni dependencias.

## Verlo localmente

```bash
cd enece-sa.com
python3 -m http.server 8000
```

Abrir `http://localhost:8000`.

## Deploy

Publicacion estatica simple. Mantener:

- `CNAME`
- carpeta `assets/`
- paginas por idioma
- `sitemap.xml`

## Notas

- El sitio ya incluye una estructura multilenguaje basada en paginas separadas.
- El feed de Instagram depende de un widget externo; si deja de responder, la pagina sigue cargando pero esa seccion puede quedar vacia.
