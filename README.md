# da-proj

🚀 CLI tool para configurar metadata de proyectos de portfolio con sincronización automática a través de GitHub Actions.

## ¿Qué hace?

Esta herramienta te ayuda a:

- ✅ Generar metadata estructurada para tus proyectos en formato MDX
- ✅ Crear workflows de GitHub Actions para sincronización automática
- ✅ Configurar README profesional con badges
- ✅ Validar metadata con JSON Schema

Perfecto para desarrolladores que mantienen un portfolio y quieren automatizar la actualización de sus proyectos.

## Instalación

No necesitas instalar nada. Usa directamente con `npx` o `bunx`:

```bash
# Con npm
npx da-proj --init

# Con bun
bunx da-proj --init
```

O instala globalmente:

```bash
npm install -g da-proj
```

## Uso

### Inicializar metadata en un proyecto

```bash
cd tu-proyecto
npx da-proj --init
```

El CLI te guiará a través de preguntas interactivas para configurar:

- Título del proyecto
- Categoría (Web Development, AI/ML, etc.)
- Tipo (featured o small)
- Estado (active, in-progress, archived)
- Tecnologías utilizadas
- URLs de demo y repositorio
- Imágenes y galería

### Archivos generados

Después de ejecutar el comando, se crearán:

```
.project-metadata.mdx          # Metadata del proyecto en MDX
.project-schema.json           # Schema de validación
.github/workflows/sync-portfolio.yml  # Workflow de GitHub Actions
proj-images/                   # Carpeta para tus imágenes del proyecto
  ├── README.md                # Instrucciones sobre imágenes
  └── .gitkeep                 # Para trackear carpeta en git
README.md                      # README profesional (si no existe)
```

### Ejemplo de .project-metadata.mdx

```mdx
---
title: "Mi Proyecto Awesome"
category: "Web Development"
type: "featured"
status: "active"
technologies:
  - React
  - TypeScript
  - Node.js
images:
  cover: /proj-images/cover.png
  gallery:
    - /proj-images/screenshot1.png
    - /proj-images/screenshot2.png
---

# Mi Proyecto Awesome

## Description

[Tu descripción aquí]

## Key Features

- Feature 1
- Feature 2
```

## Configuración de GitHub Actions

Para que la sincronización funcione, necesitas configurar estos secrets en tu repositorio:

1. Ve a Settings > Secrets and variables > Actions
2. Agrega:
   - `PORTFOLIO_API_URL`: URL de tu API de portfolio
   - `PORTFOLIO_API_KEY`: Tu API key

Cada vez que hagas push con cambios en `.project-metadata.mdx`, se sincronizará automáticamente.

## Opciones

```bash
da-proj [options]

Opciones:
  -i, --init              Inicializar metadata del proyecto
  -p, --portfolio <url>   URL de tu portfolio API
  -h, --help              Mostrar ayuda
```

## Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/da-proj.git
cd da-proj

# Instalar dependencias
bun install

# Ejecutar en modo desarrollo
bun run dev --init

# Compilar
bun run build
```

## Requisitos

- Bun runtime (recomendado) o Node.js 18+
- Git repository inicializado

## Licencia

MIT

## Autor

Tu Nombre

---

💼 Hecho con ❤️ para automatizar portfolios de desarrolladores
