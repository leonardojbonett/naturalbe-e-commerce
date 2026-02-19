# Keyword -> URL Map (Natural Be)

Fecha: 2026-02-16

## 1) Multivitaminicos (transaccional)
- URL principal: `/multivitaminicos.html`
- Destino interno: `/category.html?q=multivitaminico`
- Keywords foco:
  - `multivitaminico colombia`
  - `multivitaminicos colombia`
  - `multivitaminico`
  - `multivitaminicos`

## 2) Multivitaminico para hombre (transaccional)
- URL principal: `/multivitaminico-para-hombre.html`
- Destino interno: `/category.html?q=multivitaminico%20hombres`
- Keywords foco:
  - `multivitaminico para hombre`
  - `multivitaminico para hombres`
  - `vitaminas para hombres`

## 3) Vitamina C (transaccional)
- URL principal: `/vitamina-c-colombia.html`
- Destino interno: `/category.html?q=vitamina%20c`
- Keywords foco:
  - `vitamina c comprar colombia`
  - `vitamina c colombia`
  - `vitamina c 1000 mg colombia`
  - `vitamina c con zinc colombia`
- Excluir en contenidos/campanas:
  - `misoprostol`
  - terminos de farmacia no relacionados con suplementos

## 4) Vitamina D3 (transaccional)
- URL principal: `/vitamina-d3-colombia.html`
- Destino interno: `/category.html?q=vitamina%20d3`
- Keywords foco:
  - `vitamina d3 colombia`
  - `vitamina d3 2000 ui`
  - `colecalciferol 2000 ui`
  - `calcio con vitamina d3`

## 5) Clusters ya fuertes del sitio (mantener)
- `/catalogo-omega.html` -> omega 3, omega 3 colombia
- `/catalogo-colageno.html` -> colageno hidrolizado
- `/catalogo-minerales.html` -> magnesio, zinc
- `/catalogo-vitaminas.html` -> vitaminas generales

## Notas de implementacion
- Mantener una sola URL principal por cluster para evitar canibalizacion.
- Enlazar estas URLs desde Home, menu y blog.
- Actualizar `sitemap.xml` via `node scripts/generate-sitemap.js` despues de cada alta de URL SEO.

## 6) Clusters Keyword Surfer (capturas 2026-02-17)
- URL principal: `/vitaminas-para-el-cansancio-colombia.html`
  - Destino interno: `/category.html?q=vitaminas%20para%20el%20cansancio`
  - Keywords foco: `vitaminas para el cansancio`, `vitamina para el cansancio`
- URL principal: `/suplementos-para-energia-diaria-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20energia%20diaria%20colombia`
  - Keywords foco: `suplementos para energia diaria colombia`, `vitaminas para energia`
- URL principal: `/suplementos-para-defensas-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20defensas%20colombia`
  - Keywords foco: `suplementos para defensas colombia`, `vitaminas para subir defensas`
- URL principal: `/vitaminas-para-el-sistema-inmune-colombia.html`
  - Destino interno: `/category.html?q=vitaminas%20para%20el%20sistema%20inmune%20colombia`
  - Keywords foco: `vitaminas para el sistema inmune colombia`, `vitaminas para defensas`

## 7) Clusters Keyword Surfer (capturas 2026-02-17 segunda ronda)
- URL principal: `/suplementos-para-piel-cabello-y-unas-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20piel%20cabello%20y%20unas%20colombia`
  - Keywords foco: `suplementos para piel cabello y uñas colombia`, `vitaminas para cabello uñas y piel`
- URL principal: `/vitaminas-para-el-cabello-colombia.html`
  - Destino interno: `/category.html?q=vitamina%20para%20el%20cabello`
  - Keywords foco: `vitamina para el cabello`, `vitaminas para el cabello`
- URL principal: `/suplementos-para-estres-y-sueno-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20estres%20y%20sueno`
  - Keywords foco: `suplementos para estrés y sueño`, `que tomar para el estres`
- URL principal: `/vitaminas-para-dormir-mejor-colombia.html`
  - Destino interno: `/category.html?q=vitaminas%20para%20dormir%20mejor%20colombia`
  - Keywords foco: `vitaminas para dormir mejor colombia`, `melatonina`
- URL principal: `/suplementos-para-articulaciones-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20articulaciones%20colombia`
  - Keywords foco: `suplementos para articulaciones colombia`
- URL principal: `/colageno-hidrolizado-para-que-sirve-colombia.html`
  - Destino interno: `/colageno-hidrolizado-colombia.html`
  - Keywords foco: `para sirve el colageno hidrolizado`, `que es el colageno hidrolizado`

## 8) Clusters Keyword Surfer (capturas 2026-02-17 tercera ronda)
- URL principal: `/que-es-un-suplemento-dietario-colombia.html`
  - Destino interno: `/suplementos-dietarios-colombia.html`
  - Keywords foco: `que es un suplemento dietario`, `que son suplementos dietarios`
- URL principal: `/suplementos-dietarios-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20dietarios%20colombia`
  - Keywords foco: `suplementos dietarios`, `suplemento dietario para que sirve`
- URL principal: `/suplementos-para-digestion-y-transito-intestinal-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20digestion%20y%20transito%20intestinal%20colombia`
  - Keywords foco: `suplementos para digestion y transito intestinal colombia`
- URL principal: `/como-tomar-probioticos-colombia.html`
  - Destino interno: `/category.html?q=probioticos`
  - Keywords foco: `como tomar probioticos`, `probioticos como tomarlos`

## 9) Regla Anti-Canibalizacion (implementada)
- Tipo `hub por objetivo`:
  - `/objetivo-energia.html`
  - `/objetivo-inmunidad.html`
  - `/objetivo-estres.html`
  - `/objetivo-piel.html`
- Tipo `landing keyword exacta` (prioridad SEO):
  - Energía: `/suplementos-para-energia-diaria-colombia.html`, `/vitaminas-para-el-cansancio-colombia.html`
  - Inmunidad: `/suplementos-para-defensas-colombia.html`, `/vitaminas-para-el-sistema-inmune-colombia.html`
  - Estrés/sueño: `/suplementos-para-estres-y-sueno-colombia.html`, `/vitaminas-para-dormir-mejor-colombia.html`
  - Piel/cabello/uñas: `/suplementos-para-piel-cabello-y-unas-colombia.html`, `/vitaminas-para-el-cabello-colombia.html`
  - Dietarios/digestión: `/suplementos-dietarios-colombia.html`, `/que-es-un-suplemento-dietario-colombia.html`, `/suplementos-para-digestion-y-transito-intestinal-colombia.html`, `/como-tomar-probioticos-colombia.html`
- Regla de enlazado:
  - Los hubs enlazan a landings exactas.
  - Las landings exactas pueden enlazar al hub como apoyo de navegación, pero mantienen su keyword principal en `title`, `h1` y contenido.

## 10) Long-tail producto + beneficio (capturas 2026-02-17)
- URL principal: `/zinc-para-defensas-colombia.html`
  - Destino interno: `/category.html?q=zinc`
  - Keywords foco: `zinc para defensas colombia`, `suplemento zinc para defensas`
- URL principal: `/magnesio-para-calambres-colombia.html`
  - Destino interno: `/category.html?q=magnesio`
  - Keywords foco: `magnesio para calambres colombia`, `suplemento de magnesio para calambres`
- URL principal: `/omega-3-para-trigliceridos-colombia.html`
  - Destino interno: `/category.html?q=omega%203`
  - Keywords foco: `omega 3 para trigliceridos`, `omega 3 para bajar trigliceridos`
- URL principal: `/colageno-con-vitamina-c-beneficios-colombia.html`
  - Destino interno: `/category.html?q=colageno%20vitamina%20c`
  - Keywords foco: `colageno con vitamina c beneficios`, `colageno hidrolizado con vitamina c`

## 11) Long-tail por segmento deportivo y edad (capturas 2026-02-17)
- URL principal: `/multivitaminico-para-hombre.html`
  - Destino interno: `/category.html?q=multivitaminico%20hombre%20colombia`
  - Keywords foco: `multivitaminico hombre colombia`, `multivitaminico para hombre`
- URL principal: `/multivitaminico-mujer-50-anos-colombia.html`
  - Destino interno: `/category.html?q=multivitaminico%20mujer%2050%20anos%20colombia`
  - Keywords foco: `multivitaminico mujer 50 años colombia`, `centrum silver women`
- URL principal: `/suplementos-para-gimnasio-colombia.html`
  - Destino interno: `/category.html?q=suplementos%20para%20gimnasio%20colombia`
  - Keywords foco: `suplementos para gimnasio colombia`, `tienda de proteinas`
- URL principal: `/vitaminas-para-rendimiento-deportivo-colombia.html`
  - Destino interno: `/category.html?q=vitaminas%20para%20rendimiento%20deportivo%20colombia`
  - Keywords foco: `vitaminas para rendimiento deportivo colombia`, `suplementos deportivos`

## 12) Keywords marca + producto (capturas 2026-02-17)
- URL principal: `/catalogo-funat.html`
  - Destino interno: `/category.html?brand=funat`
  - Keywords foco: `funat suplementos colombia`, `productos funat`
- URL principal: `/funat-vitaminas-colombia.html`
  - Destino interno: `/category.html?q=funat%20vitaminas%20colombia`
  - Keywords foco: `funat vitaminas colombia`, `categoria vitaminas funat`
- URL principal: `/healthy-america-suplementos-colombia.html`
  - Destino interno: `/category.html?q=healthy%20america%20suplementos%20colombia`
  - Keywords foco: `healthy america suplementos colombia`, `productos healthy america`
- URL principal: `/healthy-america-vitaminas-colombia.html`
  - Destino interno: `/category.html?q=healthy%20america%20vitaminas%20colombia`
  - Keywords foco: `healthy america vitaminas colombia`, `healthy america catalogo`

## 13) Keywords marca + producto (capturas 2026-02-17 ronda Millenium)
- URL principal: `/millenium-natural-systems-suplementos-colombia.html`
  - Destino interno: `/category.html?q=millenium%20natural%20systems%20suplementos%20colombia`
  - Keywords foco: `millenium natural systems suplementos colombia`, `natural systems productos`
- URL principal: `/millenium-natural-systems-vitaminas-colombia.html`
  - Destino interno: `/category.html?q=millenium%20natural%20systems%20vitaminas%20colombia`
  - Keywords foco: `millenium natural systems vitaminas colombia`, `natural systems vitaminas`
- URL principal: `/millenium-natural-systems-productos-colombia.html`
  - Destino interno: `/category.html?q=productos%20millenium%20natural%20systems%20colombia`
  - Keywords foco: `productos millenium natural systems`, `millenium natural systems`
- URL principal: `/healthy-america-productos-colombia.html`
  - Destino interno: `/category.html?q=healthy%20america%20productos%20colombia`
  - Keywords foco: `healthy america productos`, `productos healthy america`

## 14) Clusters locales Barranquilla (capturas 2026-02-17)
- URL principal: `/tienda-naturista-barranquilla.html`
  - Destino interno: `/category.html?q=tienda%20naturista%20barranquilla`
  - Keywords foco: `tienda naturista barranquilla`, `tiendas naturistas barranquilla`
- URL principal: `/suplementos-en-barranquilla.html`
  - Destino interno: `/category.html?q=suplementos%20en%20barranquilla`
  - Keywords foco: `suplementos en barranquilla`, `tienda de suplementos barranquilla`
- URL principal: `/vitaminas-en-barranquilla.html`
  - Destino interno: `/category.html?q=vitaminas%20en%20barranquilla`
  - Keywords foco: `vitaminas en barranquilla`, `tienda de vitaminas barranquilla`
