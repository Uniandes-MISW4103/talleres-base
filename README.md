# Talleres de Pruebas Automatizadas de Software

Repositorio de talleres del curso **Pruebas Automatizadas de Software** (MISW4103). Contiene la
aplicación bajo prueba de todos los talleres, [EverShop](https://evershop.io) 2.1.1 (una tienda en
línea de código abierto), lista para ejecutarse con Docker, y un proyecto por taller con su runner
y su implementación base.

El equipo docente crea un repositorio privado para cada estudiante a partir de esta plantilla y
agrega `asignacion.json` con su nombre, su correo y su tipo (A, B, C o D). El tipo determina la
variante de la actividad que le corresponde en cada taller. No modifique ese archivo.

## Requisitos

- Node.js 24 (`lts/krypton`). El repositorio incluye un `.nvmrc`, por lo que pueden usar `nvm use`.
- Docker Desktop (o Docker Engine con Compose v2) con al menos 4 GB de memoria.
- Git.

No instalen globalmente ninguna herramienta de los talleres (Playwright, Cypress, Cucumber, etc.):
cada taller las declara en su `package.json` y se ejecutan con `npm run` o `npx`.

## Uso

Clonen su repositorio **fuera** del repositorio del proyecto del curso y, desde su raíz:

```bash
nvm use
npm install
npm run app:up
```

`npm install` instala las dependencias de todos los talleres y los navegadores que usan.
`npm run app:up` inicia EverShop y, la primera vez, carga los datos de ejemplo y crea el usuario
administrador.

| Comando | Qué hace |
|---|---|
| `npm run app:up` | Inicia EverShop (y la primera vez carga los datos de ejemplo). |
| `npm run app:down` | Detiene EverShop sin borrar los datos. |
| `npm run app:reset` | Borra los datos y vuelve a iniciar EverShop desde cero. |

| URL | Contenido |
|---|---|
| <http://localhost:3000> | Tienda |
| <http://localhost:3000/admin> | Administración (`admin@test.com` / `admin123`) |
| <http://localhost:3001> | Versión _release_ de la tienda (taller de regresión visual) |

## Estructura

```plaintext
├── talleres/
│   ├── monkey-testing/
│   ├── behavior-driven-development/
│   ├── visual-regression-testing/
│   └── end-to-end-testing/
├── asignacion.json      # nombre, correo y tipo; lo escribe el equipo docente
├── compose.yml          # EverShop 2.1.1, PostgreSQL 16 y el proxy de la versión release
├── evershop/            # configuración del proxy y archivos de la versión release
└── scripts/             # instalación de los talleres y app:up, app:down, app:reset
```

Cada taller tiene un **runner** (`runner/`) que ejecuta su trabajo y escribe el resumen de la
ejecución en `results/summary.json`. El runner, la configuración y las dependencias no se
modifican; cada enunciado indica los únicos archivos que puede editar:

| Taller | Archivos que puede editar |
|---|---|
| monkey-testing | `src/actions.js`, `README.md` |
| behavior-driven-development | `features/` (features y _step definitions_), `README.md` |
| visual-regression-testing | `vrt.config.js`, `README.md` |
| end-to-end-testing | `cypress/e2e/customer-checkout.cy.js`, `README.md` |

`.github/CODEOWNERS` asigna el resto del repositorio al equipo docente.

## Entrega y evaluación

Cada taller se entrega con un _tag_ (`taller-<taller>`, por ejemplo `taller-monkey-testing`) subido
a más tardar el día de la fecha límite. La evaluación es automática y la ejecuta el equipo docente:
corre el runner del taller con sus propios parámetros sobre el _commit_ del _tag_ y revisa el
resumen. Una entrega cuenta si:

- el _tag_ se subió a tiempo;
- el repositorio solo contiene archivos de texto: nada de resultados, capturas, imágenes ni otros
  archivos binarios (el `.gitignore` los excluye);
- los archivos que no se pueden editar, incluido `asignacion.json`, no cambiaron;
- el resumen de la ejecución cumple los criterios del enunciado.

## Solución de problemas

- **El puerto 3000 o 3001 está en uso**: detengan la aplicación que lo usa, por ejemplo el EverShop
  de otro repositorio (`npm run app:down` en esa carpeta).
- **`npm run app:up` falla en `docker compose`**: verifiquen que Docker esté en ejecución
  (`docker info`).
- **La tienda muestra errores después de varias pruebas**: `npm run app:reset`.
