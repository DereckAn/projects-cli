# Workflow Visual - Paso a Paso

## 🎬 La Historia Completa

```
TÚ                          GITHUB                        TU PORTFOLIO
│                              │                               │
│  1. Editas proyecto          │                               │
│  ─────────────────>          │                               │
│                              │                               │
│  2. git push                 │                               │
│  ─────────────────>          │                               │
│                              │                               │
│                         🤖 ROBOT SE ACTIVA                   │
│                              │                               │
│                         📥 Descarga código                   │
│                              │                               │
│                         📖 Lee .project-metadata.mdx         │
│                              │                               │
│                         📦 Empaqueta datos                   │
│                              │                               │
│                              │  3. POST /api/update-project  │
│                              │  ──────────────────────────>  │
│                              │                               │
│                              │                          🔐 Valida API key
│                              │                               │
│                              │                          💾 Guarda en DB
│                              │                               │
│                              │  4. ✅ Success                │
│                              │  <──────────────────────────  │
│                              │                               │
│                         ✅ Badge: "Synced!"                  │
│                              │                               │
│  5. Ves en Actions           │                               │
│  <─────────────────          │                               │
│                              │                               │
│  6. Visitas portfolio        │                               │
│  ───────────────────────────────────────────────────────────>│
│                              │                               │
│  7. ¡Proyecto actualizado! ✨│                               │
│  <───────────────────────────────────────────────────────────│
```

---

## 📋 Desglose de cada paso

### PASO 1: Checkout code
```
┌─────────────────────────────┐
│  GitHub Actions Runner      │
│  (Máquina virtual Ubuntu)   │
│                             │
│  $ git clone tu-repo        │
│  ✓ Código descargado        │
└─────────────────────────────┘
```

### PASO 2: Setup Bun
```
┌─────────────────────────────┐
│  $ curl -fsSL bun.sh/install│
│  $ bun --version            │
│  ✓ Bun instalado            │
└─────────────────────────────┘
```

### PASO 3: Extract metadata
```
┌─────────────────────────────────────────┐
│  $ bun install gray-matter              │
│  $ bun run script.js                    │
│                                         │
│  📄 .project-metadata.mdx               │
│  ↓                                      │
│  📊 Parsea YAML + Markdown              │
│  ↓                                      │
│  🔧 Agrega info de GitHub               │
│  ↓                                      │
│  📦 JSON completo                       │
│                                         │
│  {                                      │
│    "metadata": {                        │
│      "title": "Mi Proyecto",            │
│      "category": "Web Dev",             │
│      "repository": {                    │
│        "url": "github.com/..."          │
│      }                                  │
│    },                                   │
│    "markdown": "# Descripción..."       │
│  }                                      │
└─────────────────────────────────────────┘
```

### PASO 4: Notify Portfolio
```
┌─────────────────────────────────────────┐
│  $ curl -X POST                         │
│    https://tu-portfolio.com/api/...     │
│    -H "Authorization: Bearer KEY"       │
│    -d '{ JSON data }'                   │
│                                         │
│  ↓                                      │
│                                         │
│  TU PORTFOLIO RECIBE:                   │
│  ┌───────────────────────────────────┐ │
│  │ POST /api/update-project          │ │
│  │                                   │ │
│  │ Headers:                          │ │
│  │   Authorization: Bearer abc123... │ │
│  │   Content-Type: application/json  │ │
│  │                                   │ │
│  │ Body:                             │ │
│  │   { metadata: {...}, markdown }   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ↓                                      │
│                                         │
│  TU API PROCESA:                        │
│  1. ✓ Valida API key                    │
│  2. ✓ Extrae datos                      │
│  3. ✓ Actualiza DB                      │
│  4. ✓ Retorna success                   │
└─────────────────────────────────────────┘
```

### PASO 5: Badge
```
┌─────────────────────────────┐
│  GitHub Actions Summary     │
│                             │
│  ✅ Synced to Portfolio     │
│  Last sync: Jan 13, 2026    │
└─────────────────────────────┘
```

---

## 🔄 Comparación: Con vs Sin Workflow

### ❌ SIN Workflow (Manual)

```
1. Editas .project-metadata.mdx
2. git push
3. Vas a tu portfolio
4. Abres el admin panel
5. Copias y pegas la info
6. Subes imágenes
7. Guardas
8. Publicas

⏱️ Tiempo: 10-15 minutos por proyecto
```

### ✅ CON Workflow (Automático)

```
1. Editas .project-metadata.mdx
2. git push
3. ☕ Tomas café

⏱️ Tiempo: 30 segundos (automático)
```

---

## 🎯 Datos que se envían

### Tu archivo .project-metadata.mdx:
```mdx
---
title: "TaskMaster Pro"
category: "Web Development"
type: "featured"
status: "active"
technologies:
  - React
  - TypeScript
images:
  cover: /proj-images/cover.png
---

# TaskMaster Pro

Una app de gestión de tareas...
```

### Se convierte en este JSON:
```json
{
  "metadata": {
    "title": "TaskMaster Pro",
    "category": "Web Development",
    "type": "featured",
    "status": "active",
    "technologies": ["React", "TypeScript"],
    "images": {
      "cover": "/proj-images/cover.png"
    },
    "repository": {
      "owner": "tu-usuario",
      "name": "taskmaster-pro",
      "url": "https://github.com/tu-usuario/taskmaster-pro"
    },
    "lastCommit": "abc123def456...",
    "lastUpdated": "2026-01-13T19:30:00.000Z"
  },
  "markdown": "# TaskMaster Pro\n\nUna app de gestión de tareas..."
}
```

### Tu API lo recibe y guarda en la DB:
```sql
INSERT INTO projects (
  title,
  category,
  type,
  status,
  technologies,
  cover_image,
  repository_url,
  description,
  last_updated
) VALUES (
  'TaskMaster Pro',
  'Web Development',
  'featured',
  'active',
  '["React", "TypeScript"]',
  '/proj-images/cover.png',
  'https://github.com/tu-usuario/taskmaster-pro',
  '# TaskMaster Pro...',
  '2026-01-13 19:30:00'
);
```

---

## 🔐 Seguridad

### ¿Por qué necesitas la API Key?

**Sin API Key:**
```
❌ Cualquiera podría enviar:
{
  "title": "Proyecto Falso",
  "category": "Hack"
}

Y tu portfolio lo aceptaría 😱
```

**Con API Key:**
```
✅ Solo peticiones con la key correcta:
Authorization: Bearer tu-key-secreta-123

Si la key no coincide → 401 Unauthorized ❌
```

---

## 🐛 Debugging

### Ver los logs en GitHub

```
1. Ve a tu repo en GitHub
2. Click en "Actions" (tab superior)
3. Click en el workflow "Sync to Portfolio"
4. Click en el run más reciente
5. Click en "sync" (el job)
6. Verás cada paso con logs:

   ✓ Checkout code (2s)
   ✓ Setup Bun (8s)
   ✓ Extract metadata (5s)
   ❌ Notify Portfolio (1s)
      Error: connect ECONNREFUSED
      
7. Click en el paso que falló para ver detalles
```

### Errores comunes

```
❌ "Unauthorized"
→ La API key está mal

❌ "404 Not Found"
→ La URL del portfolio está mal o el endpoint no existe

❌ "connect ECONNREFUSED"
→ Tu portfolio está caído o la URL es incorrecta

❌ "Invalid JSON"
→ Hay un error en el parsing de .project-metadata.mdx
```

---

## 💡 Tips

### 1. Probar localmente
```bash
# Simula lo que hace el workflow
bun install gray-matter
bun run -e "
import matter from 'gray-matter';
import { readFileSync } from 'fs';
const content = readFileSync('.project-metadata.mdx', 'utf8');
const { data } = matter(content);
console.log(JSON.stringify(data, null, 2));
"
```

### 2. Probar el API manualmente
```bash
curl -X POST https://tu-portfolio.com/api/update-project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-api-key" \
  -d '{"test": true}'
```

### 3. Ver qué se envió
En los logs de GitHub Actions, busca el output del paso "Extract metadata" para ver el JSON completo.

---

## 🎓 Resumen para explicar a otros

**"Es como tener un asistente que:**
1. **Vigila** tus proyectos en GitHub
2. **Lee** la información cuando cambias algo
3. **Envía** automáticamente los cambios a tu portfolio
4. **Todo en 30 segundos sin que hagas nada"**

---

¿Ahora tiene más sentido? 😊
