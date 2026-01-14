# Explicación Detallada del Workflow

## ¿Qué es un GitHub Actions Workflow?

Es un **robot automático** que GitHub ejecuta por ti cuando ocurren ciertos eventos (como hacer push).

---

## Estructura del Workflow

### 1. Nombre del Workflow

```yaml
name: Sync to Portfolio
```

**¿Qué hace?** Le da un nombre al workflow que verás en la pestaña "Actions" de GitHub.

---

### 2. Cuándo se ejecuta (Triggers)

```yaml
on:
  push:
    branches: [main, master]
    paths:
      - '.project-metadata.mdx'
      - 'proj-images/**'
  workflow_dispatch:
```

**¿Qué hace?** Define CUÁNDO se ejecuta el robot:

#### Trigger 1: `push`
- **Cuándo:** Cuando haces `git push`
- **Condiciones:**
  - Solo en las ramas `main` o `master` (no en otras ramas)
  - Solo si cambiaste `.project-metadata.mdx` O archivos en `proj-images/`
  
**Ejemplo:**
```bash
# Esto SÍ ejecuta el workflow:
git add .project-metadata.mdx
git commit -m "Update project info"
git push origin main

# Esto NO ejecuta el workflow:
git add src/index.ts
git commit -m "Fix bug"
git push origin main
```

#### Trigger 2: `workflow_dispatch`
- **Cuándo:** Cuando TÚ lo ejecutas manualmente desde GitHub
- **Cómo:** Ve a Actions > Sync to Portfolio > Run workflow

---

### 3. El Trabajo (Job)

```yaml
jobs:
  sync:
    runs-on: ubuntu-latest
```

**¿Qué hace?**
- `sync`: Nombre del trabajo
- `runs-on: ubuntu-latest`: Usa una máquina virtual con Ubuntu (Linux) para ejecutar el código

**Analogía:** Es como si GitHub te prestara una computadora con Ubuntu por unos minutos para ejecutar tu código.

---

### 4. Los Pasos (Steps)

El workflow tiene 4 pasos que se ejecutan en orden:

---

## PASO 1: Checkout code

```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

**¿Qué hace?** Descarga tu código del repositorio a la máquina virtual.

**Analogía:** Es como hacer `git clone` de tu proyecto.

**Resultado:** Ahora la máquina virtual tiene todos tus archivos:
```
/home/runner/work/tu-proyecto/
├── .project-metadata.mdx
├── proj-images/
├── src/
└── ...
```

---

## PASO 2: Setup Bun

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest
```

**¿Qué hace?** Instala Bun (el runtime de JavaScript) en la máquina virtual.

**Por qué:** Necesitamos Bun para ejecutar código JavaScript/TypeScript.

**Resultado:** Ahora puedes ejecutar comandos como `bun install` y `bun run`.

---

## PASO 3: Extract metadata (El más importante)

```yaml
- name: Extract metadata
  id: metadata
  run: |
    bun install gray-matter
    bun run -e "
    import matter from 'gray-matter';
    import { readFileSync } from 'fs';
    
    const content = readFileSync('.project-metadata.mdx', 'utf8');
    const { data, content: markdown } = matter(content);
    
    data.repository = {
      owner: process.env.GITHUB_REPOSITORY.split('/')[0],
      name: process.env.GITHUB_REPOSITORY.split('/')[1],
      url: `https://github.com/${process.env.GITHUB_REPOSITORY}`
    };
    data.lastCommit = process.env.GITHUB_SHA;
    data.lastUpdated = new Date().toISOString();
    
    console.log('METADATA=' + JSON.stringify({ metadata: data, markdown }));
    " > output.txt
    
    METADATA=$(cat output.txt | grep METADATA | cut -d'=' -f2-)
    echo "data<<EOF" >> $GITHUB_OUTPUT
    echo "$METADATA" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
```

**¿Qué hace?** Este es el paso más complejo. Vamos por partes:

### 3.1 Instalar dependencia
```bash
bun install gray-matter
```
Instala la librería `gray-matter` que lee archivos MDX.

### 3.2 Leer el archivo .project-metadata.mdx
```javascript
const content = readFileSync('.project-metadata.mdx', 'utf8');
const { data, content: markdown } = matter(content);
```

**¿Qué hace?**
- Lee tu archivo `.project-metadata.mdx`
- Lo separa en dos partes:
  - `data`: El frontmatter (la metadata en YAML)
  - `markdown`: El contenido en Markdown

**Ejemplo:**

Tu archivo:
```mdx
---
title: "Mi Proyecto"
category: "Web Development"
---

# Mi Proyecto
Descripción...
```

Se convierte en:
```javascript
data = {
  title: "Mi Proyecto",
  category: "Web Development"
}

markdown = "# Mi Proyecto\nDescripción..."
```

### 3.3 Agregar información del repositorio
```javascript
data.repository = {
  owner: process.env.GITHUB_REPOSITORY.split('/')[0],
  name: process.env.GITHUB_REPOSITORY.split('/')[1],
  url: `https://github.com/${process.env.GITHUB_REPOSITORY}`
};
```

**¿Qué hace?** Agrega automáticamente información de GitHub:

**Variables de entorno de GitHub:**
- `GITHUB_REPOSITORY`: `"tu-usuario/tu-proyecto"`
- `GITHUB_SHA`: `"abc123..."` (hash del commit)

**Resultado:**
```javascript
data.repository = {
  owner: "tu-usuario",
  name: "tu-proyecto",
  url: "https://github.com/tu-usuario/tu-proyecto"
}
data.lastCommit = "abc123..."
data.lastUpdated = "2026-01-13T19:30:00.000Z"
```

### 3.4 Guardar en output
```bash
console.log('METADATA=' + JSON.stringify({ metadata: data, markdown }));
" > output.txt

METADATA=$(cat output.txt | grep METADATA | cut -d'=' -f2-)
echo "data<<EOF" >> $GITHUB_OUTPUT
echo "$METADATA" >> $GITHUB_OUTPUT
echo "EOF" >> $GITHUB_OUTPUT
```

**¿Qué hace?**
1. Imprime todo en formato JSON
2. Lo guarda en `output.txt`
3. Extrae solo la parte después de `METADATA=`
4. Lo guarda en `$GITHUB_OUTPUT` para usarlo en el siguiente paso

**Resultado:** Ahora tienes una variable `steps.metadata.outputs.data` con todo el JSON.

---

## PASO 4: Notify Portfolio (Enviar a tu portfolio)

```yaml
- name: Notify Portfolio
  env:
    PORTFOLIO_API_URL: ${{ secrets.PORTFOLIO_API_URL }}
    PORTFOLIO_API_KEY: ${{ secrets.PORTFOLIO_API_KEY }}
  run: |
    curl -X POST "$PORTFOLIO_API_URL/api/update-project" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PORTFOLIO_API_KEY" \
      -d '${{ steps.metadata.outputs.data }}'
```

**¿Qué hace?** Envía los datos a tu portfolio usando `curl` (como hacer una petición HTTP).

### Desglose:

#### Variables de entorno
```yaml
env:
  PORTFOLIO_API_URL: ${{ secrets.PORTFOLIO_API_URL }}
  PORTFOLIO_API_KEY: ${{ secrets.PORTFOLIO_API_KEY }}
```
Lee los secrets que configuraste en GitHub.

#### El comando curl
```bash
curl -X POST "$PORTFOLIO_API_URL/api/update-project" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PORTFOLIO_API_KEY" \
  -d '${{ steps.metadata.outputs.data }}'
```

**Traducción:**
- `curl`: Herramienta para hacer peticiones HTTP
- `-X POST`: Método POST (enviar datos)
- `"$PORTFOLIO_API_URL/api/update-project"`: URL completa (ej: `https://miportfolio.com/api/update-project`)
- `-H "Content-Type: application/json"`: Header que dice "estoy enviando JSON"
- `-H "Authorization: Bearer $PORTFOLIO_API_KEY"`: Header con tu API key para autenticación
- `-d '...'`: Los datos (el JSON con toda la metadata)

**Analogía:** Es como enviar un formulario web, pero desde código.

**Lo que recibe tu portfolio:**
```json
{
  "metadata": {
    "title": "Mi Proyecto",
    "category": "Web Development",
    "technologies": ["React", "TypeScript"],
    "repository": {
      "owner": "tu-usuario",
      "name": "tu-proyecto",
      "url": "https://github.com/tu-usuario/tu-proyecto"
    },
    "lastCommit": "abc123...",
    "lastUpdated": "2026-01-13T19:30:00.000Z"
  },
  "markdown": "# Mi Proyecto\n\nDescripción..."
}
```

---

## PASO 5: Create deployment badge

```yaml
- name: Create deployment badge
  if: success()
  run: |
    echo "![Synced to Portfolio](https://img.shields.io/badge/portfolio-synced-success)" >> $GITHUB_STEP_SUMMARY
    echo "Last sync: $(date)" >> $GITHUB_STEP_SUMMARY
```

**¿Qué hace?** Si todo salió bien, muestra un mensaje bonito en GitHub.

- `if: success()`: Solo se ejecuta si los pasos anteriores funcionaron
- `$GITHUB_STEP_SUMMARY`: Archivo especial que GitHub muestra al final del workflow

**Resultado:** Verás esto en GitHub Actions:

```
![Synced to Portfolio](badge-verde)
Last sync: Mon Jan 13 19:30:00 UTC 2026
```

---

## Flujo Completo - Ejemplo Real

### Escenario: Actualizas tu proyecto

```bash
# 1. Editas el archivo
nano .project-metadata.mdx
# Cambias: status: "in-progress" → status: "active"

# 2. Commit y push
git add .project-metadata.mdx
git commit -m "Project is now active"
git push origin main
```

### Lo que pasa en GitHub:

```
⏱️  00:00 - GitHub detecta el push
⏱️  00:01 - Inicia el workflow "Sync to Portfolio"
⏱️  00:05 - ✓ Checkout code (descarga tu repo)
⏱️  00:10 - ✓ Setup Bun (instala Bun)
⏱️  00:15 - ✓ Extract metadata (lee .project-metadata.mdx)
⏱️  00:20 - ✓ Notify Portfolio (envía a tu API)
⏱️  00:25 - ✓ Create deployment badge
⏱️  00:30 - ✅ Workflow completado!
```

### Lo que pasa en tu portfolio:

```
1. Tu API recibe la petición POST
2. Valida la API key
3. Actualiza la base de datos
4. Tu portfolio ahora muestra: status: "active" ✨
```

---

## Resumen Ultra-Simple

**El workflow es un robot que:**

1. 🤖 Se despierta cuando haces push
2. 📖 Lee tu archivo `.project-metadata.mdx`
3. 📦 Empaqueta toda la información
4. 🚀 La envía a tu portfolio
5. ✅ Tu portfolio se actualiza automáticamente

**Todo esto pasa en ~30 segundos sin que hagas nada!**

---

## ¿Qué pasa si falla?

Si algo sale mal, verás en GitHub Actions:

```
❌ Notify Portfolio - Failed
Error: connect ECONNREFUSED
```

**Posibles causas:**
- La URL del portfolio está mal
- La API key es incorrecta
- Tu portfolio está caído
- El endpoint `/api/update-project` no existe

**Solución:** Revisa los logs en GitHub Actions para ver el error exacto.

---

## ¿Puedo desactivarlo?

**Sí, de 3 formas:**

### 1. No configurar los secrets
El workflow se ejecutará pero fallará en el paso "Notify Portfolio". No afecta nada más.

### 2. Eliminar el archivo
```bash
rm .github/workflows/sync-portfolio.yml
git add .
git commit -m "Remove workflow"
git push
```

### 3. Desactivar en GitHub
Ve a Actions > Sync to Portfolio > "..." > Disable workflow

---

¿Tiene más sentido ahora? 😊
