# da-proj

> 🚀 **Automatiza tu portfolio de desarrollador** - CLI tool que simplifica la gestión de metadata de proyectos y sincronización con tu portfolio web.

## ¿Por qué da-proj?

Como desarrollador, mantener tu portfolio actualizado puede ser tedioso. Cada vez que terminas un proyecto, necesitas:

- Crear metadata estructurada
- Configurar GitHub Actions
- Sincronizar con tu portfolio web
- Gestionar API keys en múltiples dispositivos

**da-proj hace todo esto por ti** con comandos simples e interactivos.

---

## ✨ Características

### 📝 Generación Automática de Metadata

- Crea archivos `.project-metadata.mdx` con formato estructurado
- Valida con JSON Schema automáticamente
- Incluye toda la información de tu proyecto (título, tecnologías, imágenes, etc.)

### 🔄 Sincronización con Portfolio

- GitHub Actions workflow pre-configurado
- Sincroniza automáticamente cuando haces push
- Notifica a tu API de portfolio con los cambios

### 🔐 Gestión de API Keys

- Configura GitHub Secrets fácilmente desde la terminal
- Múltiples perfiles para diferentes portfolios
- Sincronización de configuración entre dispositivos vía GitHub

### 📁 Organización de Imágenes

- Carpeta `proj-images/` lista para usar
- README con guías de optimización
- Estructura consistente en todos tus proyectos

---

## 🚀 Inicio Rápido

### Instalación

No necesitas instalar nada. Usa directamente con `npx` o `bunx`:

```bash
# Con npm
npx da-proj --init

# Con bun (recomendado)
bunx da-proj --init
```

O instala globalmente:

```bash
npm install -g da-proj
# o
bun install -g da-proj
```

### Uso Básico

#### 1. Inicializar un Proyecto

```bash
cd tu-proyecto
bunx da-proj --init
```

El CLI te guiará con preguntas interactivas:

- 📌 Título del proyecto
- 🏷️ Categoría (Web Development, AI/ML, Mobile, etc.)
- ⭐ Tipo (featured o small)
- 📊 Estado (active, in-progress, archived)
- 💻 Tecnologías utilizadas
- 🔗 URLs de demo y repositorio
- 🖼️ Rutas de imágenes

#### 2. Configurar GitHub Secrets

```bash
bunx da-proj --secrets
```

Esto te permite:

- Crear/seleccionar perfiles de portfolio
- Configurar `PORTFOLIO_API_URL` y `PORTFOLIO_API_KEY`
- Guardar perfiles para reutilizar en otros proyectos

#### 3. Sincronizar Configuración (Opcional)

Si trabajas en múltiples dispositivos:

```bash
# Primera vez: Configurar GitHub sync
bunx da-proj --setup-github-sync

# Subir configuración
bunx da-proj --push

# En otro dispositivo: Descargar configuración
bunx da-proj --pull

# Ver estado de sincronización
bunx da-proj --sync-status
```

---

## 📂 Archivos Generados

Después de ejecutar `--init`, se crearán:

```
tu-proyecto/
├── .project-metadata.mdx              # ✨ Metadata del proyecto
├── .project-schema.json               # 📋 Schema de validación
├── .github/
│   └── workflows/
│       └── sync-portfolio.yml         # 🔄 GitHub Actions workflow
├── proj-images/                       # 🖼️ Carpeta para imágenes
│   ├── README.md                      # 📖 Guía de imágenes
│   └── .gitkeep
└── README.md                          # 📄 README profesional (si no existe)
```

### Ejemplo de `.project-metadata.mdx`

```mdx
---
title: "Mi App Increíble"
category: "Web Development"
type: "featured"
status: "active"
technologies:
  - React
  - TypeScript
  - Node.js
  - PostgreSQL
images:
  cover: /proj-images/cover.png
  gallery:
    - /proj-images/screenshot1.png
    - /proj-images/screenshot2.png
repository: https://github.com/usuario/mi-app
demo: https://mi-app.vercel.app
---

# Mi App Increíble

## Descripción

Una aplicación web moderna que resuelve [problema específico]...

## Características Principales

- ✅ Feature 1
- ✅ Feature 2
- ✅ Feature 3
```

---

## 🔧 Comandos Disponibles

### Comandos Principales

```bash
# Inicializar metadata del proyecto
bunx da-proj --init

# Configurar GitHub secrets
bunx da-proj --secrets

# Sincronizar configuración (export/import manual)
bunx da-proj --sync

# Mostrar ayuda
bunx da-proj --help
```

### Comandos de GitHub Sync

```bash
# Configurar sincronización vía GitHub
bunx da-proj --setup-github-sync

# Subir configuración local a GitHub
bunx da-proj --push

# Descargar configuración desde GitHub
bunx da-proj --pull

# Ver estado de sincronización
bunx da-proj --sync-status
```

---

## 🔐 Configuración de GitHub Secrets

### Opción 1: Usando el CLI (Recomendado)

```bash
bunx da-proj --secrets
```

El CLI te guiará para:

1. Verificar que GitHub CLI esté instalado
2. Crear o seleccionar un perfil
3. Configurar automáticamente los secrets en tu repo

### Opción 2: Manual

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega estos secrets:
   - `PORTFOLIO_API_URL`: URL de tu API de portfolio
   - `PORTFOLIO_API_KEY`: Tu API key

📖 **Guía detallada:** Ver [docs/SETUP-SECRETS.md](docs/SETUP-SECRETS.md)

---

## 🌐 Sincronización entre Dispositivos

### ¿Por qué sincronizar?

Si trabajas en múltiples computadoras (PC de escritorio, laptop, etc.), puedes sincronizar tus perfiles de portfolio usando GitHub.

### Configuración (Una sola vez)

```bash
# En tu primera PC
bunx da-proj --setup-github-sync
# → Crea un repo privado "da-proj-secrets"

bunx da-proj --push
# → Sube tu configuración
```

### Uso en Otros Dispositivos

```bash
# En tu laptop
bunx da-proj --setup-github-sync
# → Conecta al repo existente

bunx da-proj --pull
# → Descarga todos tus perfiles
```

📖 **Guía completa:** Ver [docs/GITHUB-SYNC.md](docs/GITHUB-SYNC.md)

---

## 🎯 Casos de Uso

### Freelancer con Múltiples Clientes

```bash
# Crear perfiles para cada cliente
bunx da-proj --secrets
# → Perfil "cliente-acme" con su portfolio
# → Perfil "cliente-tech" con su portfolio
# → Perfil "personal" con tu portfolio

# En cada proyecto, selecciona el perfil apropiado
cd proyecto-acme
bunx da-proj --secrets  # Selecciona "cliente-acme"
```

### Desarrollador con Portfolio Personal

```bash
# Una sola vez
bunx da-proj --secrets
# → Crea perfil "main"

# En cada nuevo proyecto
cd nuevo-proyecto
bunx da-proj --init     # Genera metadata
bunx da-proj --secrets  # Usa perfil "main"
```

### Equipo Compartiendo Configuración

```bash
# Líder del equipo
bunx da-proj --setup-github-sync
bunx da-proj --push

# Miembros del equipo
bunx da-proj --setup-github-sync  # Conecta al repo compartido
bunx da-proj --pull               # Descarga configuración
```

---

## 🛠️ Desarrollo

### Requisitos

- Bun runtime (recomendado) o Node.js 18+
- Git repository inicializado
- GitHub CLI (para comandos de secrets y sync)

### Setup Local

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

### Estructura del Proyecto

```
da-proj/
├── src/
│   ├── commands/          # Comandos del CLI
│   │   ├── init.ts        # Inicializar proyecto
│   │   ├── secrets.ts     # Configurar GitHub secrets
│   │   ├── sync.ts        # Sincronización manual
│   │   ├── setup-github-sync.ts
│   │   ├── push.ts
│   │   ├── pull.ts
│   │   └── sync-status.ts
│   ├── generators/        # Generadores de archivos
│   ├── utils/             # Utilidades
│   │   ├── github.ts      # GitHub CLI/API
│   │   ├── github-config.ts
│   │   └── config.ts
│   ├── types/             # TypeScript types
│   └── index.ts           # Entry point
├── docs/                  # Documentación
└── package.json
```

---

## 📚 Documentación

- [Setup de Secrets](docs/SETUP-SECRETS.md) - Guía detallada de configuración
- [GitHub Sync](docs/GITHUB-SYNC.md) - Sincronización entre dispositivos
- [Workflow Explicado](docs/WORKFLOW-EXPLICADO.md) - Cómo funciona GitHub Actions
- [Arquitectura](src/README.md) - Estructura del código

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

---

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para historial de cambios.

---

## 📄 Licencia

MIT © Dereck Angeles

---

## 💬 Soporte

¿Tienes preguntas o problemas?

- 📧 Email: tu-email@ejemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/da-proj/issues)
- 📖 Docs: [Documentación completa](docs/)

---

<div align="center">

**💼 Hecho con ❤️ para automatizar portfolios de desarrolladores**

⭐ Si te gusta este proyecto, dale una estrella en GitHub!

</div>
