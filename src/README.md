# Arquitectura del Proyecto

## Estructura de Carpetas

```
src/
├── commands/          # Comandos del CLI
│   ├── init.ts       # Comando --init (inicializar proyecto)
│   └── secrets.ts    # Comando --secrets (configurar GitHub secrets)
│
├── generators/        # Generadores de archivos
│   ├── mdx.ts        # Genera .project-metadata.mdx
│   ├── readme.ts     # Genera README.md
│   ├── schema.ts     # Genera .project-schema.json
│   └── workflow.ts   # Genera GitHub Actions workflow
│
├── utils/             # Utilidades compartidas
│   ├── config.ts     # Manejo de configuración global
│   ├── github.ts     # Funciones de GitHub CLI
│   └── logger.ts     # Logger con colores
│
├── types/             # Definiciones de tipos TypeScript
│   └── index.ts      # Todos los tipos e interfaces
│
└── index.ts           # Punto de entrada principal
```

## Flujo de Ejecución

### Comando `--init`

```
index.ts
  └─> initCommand() [commands/init.ts]
       ├─> Recopila información del usuario (prompts)
       ├─> Crea ProjectMetadata
       ├─> generateMDX() [generators/mdx.ts]
       ├─> generateWorkflow() [generators/workflow.ts]
       ├─> generateReadme() [generators/readme.ts]
       ├─> generateSchema() [generators/schema.ts]
       └─> Escribe archivos al disco
```

### Comando `--secrets`

```
index.ts
  └─> secretsCommand() [commands/secrets.ts]
       ├─> checkGitHubCLI() [utils/github.ts]
       ├─> getExistingSecrets() [utils/github.ts]
       ├─> readGlobalConfig() [utils/config.ts]
       ├─> Selecciona o crea perfil
       ├─> saveGlobalConfig() [utils/config.ts]
       └─> setGitHubSecret() [utils/github.ts]
```

## Módulos

### commands/
Contiene la lógica de cada comando del CLI. Cada comando es independiente y puede ser ejecutado por separado.

**Responsabilidades:**
- Interactuar con el usuario (prompts)
- Orquestar llamadas a utils y generators
- Manejar errores específicos del comando

### generators/
Funciones puras que generan contenido de archivos. No tienen efectos secundarios.

**Responsabilidades:**
- Generar strings con el contenido de archivos
- Formatear metadata en diferentes formatos (MDX, YAML, JSON)

### utils/
Funciones de utilidad compartidas entre comandos.

**Responsabilidades:**
- Interactuar con APIs externas (GitHub CLI)
- Leer/escribir configuración
- Logging y formateo de mensajes

### types/
Definiciones de tipos TypeScript compartidas en todo el proyecto.

**Responsabilidades:**
- Definir interfaces y tipos
- Mantener consistencia de tipos

## Agregar Nuevos Comandos

Para agregar un nuevo comando (ej: `--update`):

1. **Crear el comando:**
```typescript
// src/commands/update.ts
export async function updateCommand() {
  // Tu lógica aquí
}
```

2. **Agregar al index.ts:**
```typescript
import { updateCommand } from "./commands/update.js";

// En parseArgs:
options: {
  // ...
  update: { type: "boolean", short: "u" },
}

// En main():
if (args.values.update) {
  await updateCommand();
  process.exit(0);
}
```

3. **Actualizar help:**
```typescript
${colors.bright}OPTIONS:${colors.reset}
  // ...
  -u, --update            Update existing metadata
```

## Agregar Nuevos Generadores

Para agregar un nuevo generador (ej: `CONTRIBUTING.md`):

1. **Crear el generador:**
```typescript
// src/generators/contributing.ts
export function generateContributing(): string {
  return `# Contributing Guide...`;
}
```

2. **Usar en comando:**
```typescript
// src/commands/init.ts
import { generateContributing } from "../generators/contributing.js";

// En initCommand():
await writeFile("CONTRIBUTING.md", generateContributing());
```

## Principios de Diseño

### 1. Separación de Responsabilidades
Cada módulo tiene una responsabilidad clara y única.

### 2. Funciones Puras
Los generators son funciones puras sin efectos secundarios.

### 3. Composición
Los comandos componen funciones de utils y generators.

### 4. Tipos Fuertes
Todo está tipado con TypeScript para mayor seguridad.

### 5. Modularidad
Fácil agregar nuevos comandos, generators o utils sin modificar código existente.

## Testing (Futuro)

Estructura sugerida para tests:

```
tests/
├── commands/
│   ├── init.test.ts
│   └── secrets.test.ts
├── generators/
│   ├── mdx.test.ts
│   └── workflow.test.ts
└── utils/
    ├── config.test.ts
    └── github.test.ts
```

## Dependencias

- `@inquirer/prompts`: Prompts interactivos
- `gray-matter`: Parsing de MDX (solo en workflow generado)
- `bun`: Runtime

## Notas

- Todos los imports usan `.js` extension (requerido por ES modules)
- El shebang `#!/usr/bin/env bun` está solo en `src/index.ts`
- La configuración global se guarda en `~/.da-proj-config.json`
