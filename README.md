# Aristilia — Sistema para Foundry VTT

Sistema de juego OSR **Aristilia** para **Foundry VTT v14** (compatible v13+), adaptado de las
reglas de la web-app [`ttrpg-website-v2`](https://github.com/SFJT-Hobbie/ttrpg-website-v2)
(`src/pages/Rules*.jsx`, `src/pages/CharacterSheet.jsx`).

## Mecánicas implementadas

- **Atributos** (Fuerza, Destreza, Constitución, Inteligencia, Sabiduría, Carisma) con la
  **tabla de modificadores propia** de Aristilia: `3 → −2 · 4-6 → −1 · 7-13 → 0 · 14-17 → +1 · 18 → +2`.
- **Resolución Target20**: `1d20 + mods + CA_enemigo ≥ 20`. 20 natural = éxito, 1 natural = fallo.
- **Competencias d100%**: `d100 ≤ %`. Crítico 1-5 éxito, 96-100 fallo.
- **Derivados** calculados en la ficha: movimiento en espacios cerrados (`30 + DES·5`) y abiertos
  (`120 + DES·20`), filas de inventario (`5 + FUE`), % Bonus de XP por clase
  (Guerrero `FUE·5`, Usuario de Magia `INT·5`, cualquier clase `+SAB·5`, `+10%` por Lanzada Mortal),
  resistencia mágica (`SAB·5%`), CA total.
- **Actores**: `character` (PC) y `npc`. **Items**: arma, armadura, escudo, equipo, hechizo,
  competencia, clase, raza.
- **Inventario tipo grid** 5×(5+FUE) y competencias con/sin arma (catálogo portado del repo).
- Iniciativa de bando `1d6`, interfaz en **español**.

## Instalación

### Opción A — Local (desarrollo, sin GitHub)

1. Copia (o crea un enlace simbólico de) la carpeta `aristilia/` dentro del directorio de sistemas
   de Foundry: `{userData}/Data/systems/aristilia/`.
   - Windows (symlink, desde una terminal como administrador):
     ```
     mklink /D "%LOCALAPPDATA%\FoundryVTT\Data\systems\aristilia" "D:\FoundryVTT-System\aristilia"
     ```
2. Inicia Foundry VTT v14 y crea un **Mundo** eligiendo el sistema *Aristilia*.

### Opción B — Manifest URL (distribución vía GitHub)

Foundry instala sistemas desde la URL de un `system.json`. Para habilitarlo:

1. Sube el contenido de esta carpeta a un repo de GitHub (el manifiesto ya apunta a
   `SFJT-Hobbie/aristilia-foundry`; cámbialo en `system.json` → `url` / `manifest` / `download`
   y en `.github/workflows/release.yml` si usas otro nombre).
2. Publica una **release** creando una etiqueta de versión:
   ```
   git tag v0.2.0 && git push origin v0.2.0
   ```
   El workflow [`release.yml`](.github/workflows/release.yml) compila los compendios, empaqueta
   `aristilia.zip` y adjunta `system.json` + el zip a la release.
3. En Foundry → *Configuración → Sistemas de Juego → Instalar Sistema*, pega la **Manifest URL**:
   ```
   https://github.com/SFJT-Hobbie/aristilia-foundry/releases/latest/download/system.json
   ```
   Como el manifiesto apunta a `releases/latest/download`, cada nueva release actualiza el sistema
   automáticamente.

## Compendios

Tres compendios (`packs/`, formato LevelDB) generados desde datos del repo:

- **Equipo** (`gear`, 68 items): armas y armaduras/escudos con daño, CA, precio (piezas de plata)
  y ranuras, en variantes Desgastada (DE) / Buen Estado (BE).
- **Competencias** (`proficiencies`, 75 items): catálogo completo de competencias sin arma.
- **Razas** (`races`, 6 items): Humano, Elfo, Enano, Mediano, Hombre Bestia y Verdante, con
  modificadores de atributo, bono de HP/salvación, idiomas, ranuras y rasgos especiales.
- **Clases** (`classes`, 4 items): Guerrero, Usuario de Magia, Especialista y Multiclase, con dado
  de golpe, ranuras de competencia, salvada base, bono al golpear y progresión de XP.
- **Hechizos** (`spells`, 3 items): semilla con un ejemplo canónico por escuela (Astral, Natural,
  Voz y Forma) — ampliable, ya que las reglas del repo documentan la estructura, no una lista completa.

Los datos fuente están en [`tools/packs-data.mjs`](tools/packs-data.mjs) (equipo y hechizos) y en
[`module/data/proficiencies.mjs`](module/data/proficiencies.mjs). Para regenerar los packs tras editarlos:

```
npm install         # una vez (instala classic-level)
npm run build:packs
```

## Inventario tipo grid (drag & drop)

En la ficha de personaje, arrastra objetos desde la **Mochila** a la cuadrícula `5×(5+FUE)` para
colocarlos (respeta tamaño `w×h` y evita solapes). Doble clic sobre un objeto colocado lo devuelve
a la mochila. La lógica está en [`module/sheets/actor-sheet.mjs`](module/sheets/actor-sheet.mjs).

## Validación estática (sin Foundry)

```
node tools/validate.mjs      # JSON, rutas y plantillas
node --check aristilia.mjs   # sintaxis de los módulos
npm run build:packs          # compila compendios
```

## Verificación en Foundry

1. Crea un Actor tipo *Personaje* y comprueba que los modificadores siguen la tabla propia
   (p. ej. FUE 18 → +2, FUE 3 → −2) y que movimiento, filas de inventario y bono de XP se recalculan.
2. Haz clic en el nombre de un atributo para lanzar una **tirada Target20** (tarjeta en chat).
3. Crea un Item *Competencia* (sin arma), fija su % y lánzalo con el botón de dado (**d100%**).
4. Crea un *Arma*, asígnale daño y usa el botón de ataque (tirada de ataque + daño).
5. Crea un *PNJ* y verifica sus campos (DG, CA, salvación, movimiento).
6. Revisa que la consola del navegador no muestre errores en `init`/`ready`.

## Estado y hoja de ruta

**MVP + 5 compendios + drag-and-drop de inventario + auto-CA al equipar.**

Al equipar una armadura o escudo (botón del escudo en la sección *Armaduras y Escudos*), su CA se
aplica automáticamente al total del personaje; sin nada equipado, se usan los campos manuales de CA.

Pendiente para fases posteriores:
- Ampliar el compendio de hechizos con listas completas por escuela (cuando existan como datos).
- Aplicar automáticamente los modificadores de raza/clase a los atributos y derivados del personaje.
- Añadir equipo no combativo (indumentaria, suministros, maquinaria, compañeros).
- Automatización de rondas de combate por fases (movimiento/proyectiles/melee/hechizos).

## Créditos

Reglas y datos: **Aristilia** por SFJT-Hobbie. Sistema de Foundry generado a partir de dicho repositorio.
