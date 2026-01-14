# Configuración de GitHub Secrets

Para que el workflow de sincronización funcione, necesitas configurar dos secrets en tu repositorio de GitHub.

## ¿Qué son estos secrets?

1. **`PORTFOLIO_API_URL`**: La URL de tu portfolio donde está el endpoint API
2. **`PORTFOLIO_API_KEY`**: Una clave secreta para autenticar las peticiones

## Paso 1: Crear tu Portfolio API

Primero necesitas tener un endpoint en tu portfolio que reciba las actualizaciones.

### Ejemplo con Next.js

Crea un archivo en tu portfolio:

```typescript
// app/api/update-project/route.ts (Next.js 13+)
// o pages/api/update-project.ts (Next.js 12)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar la API key
    const authHeader = request.headers.get('Authorization');
    const apiKey = process.env.PORTFOLIO_API_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Obtener los datos
    const data = await request.json();
    
    console.log('Received project update:', {
      title: data.metadata.title,
      repository: data.metadata.repository
    });
    
    // 3. Guardar en tu base de datos
    // Ejemplo con Prisma:
    /*
    await prisma.project.upsert({
      where: { 
        repositoryUrl: data.metadata.repository.url 
      },
      update: {
        title: data.metadata.title,
        category: data.metadata.category,
        type: data.metadata.type,
        status: data.metadata.status,
        technologies: data.metadata.technologies,
        coverImage: data.metadata.images.cover,
        galleryImages: data.metadata.images.gallery,
        demo: data.metadata.demo,
        description: data.markdown,
        lastUpdated: new Date()
      },
      create: {
        title: data.metadata.title,
        category: data.metadata.category,
        type: data.metadata.type,
        status: data.metadata.status,
        technologies: data.metadata.technologies,
        coverImage: data.metadata.images.cover,
        galleryImages: data.metadata.images.gallery,
        demo: data.metadata.demo,
        description: data.markdown,
        repositoryUrl: data.metadata.repository.url,
        lastUpdated: new Date()
      }
    });
    */
    
    // Por ahora, solo retornar éxito
    return NextResponse.json({ 
      success: true,
      message: 'Project updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Ejemplo con Express.js

```javascript
// server.js o routes/api.js
const express = require('express');
const router = express.Router();

router.post('/api/update-project', async (req, res) => {
  try {
    // 1. Verificar API key
    const authHeader = req.headers.authorization;
    const apiKey = process.env.PORTFOLIO_API_KEY;
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. Obtener datos
    const data = req.body;
    
    console.log('Received project update:', {
      title: data.metadata.title,
      repository: data.metadata.repository
    });
    
    // 3. Guardar en base de datos
    // ... tu lógica aquí
    
    res.json({ 
      success: true,
      message: 'Project updated successfully'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## Paso 2: Generar la API Key

Puedes generar una API key segura de varias formas:

### Opción 1: Usando el script incluido

```bash
# Con Bun
bun run generate-key

# Con Node.js
npm run generate-key:node

# Con PowerShell (Windows)
npm run generate-key:ps
# o directamente:
pwsh -File generate-api-key.ps1
```

### Opción 2: PowerShell (Windows) - Un solo comando

```powershell
# Generar key de 32 bytes en hexadecimal
[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower()
```

Esto genera algo como:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Opción 3: PowerShell - Más simple con GUID

```powershell
# Generar un GUID (más corto pero suficiente)
(New-Guid).Guid.Replace("-","")
```

### Opción 4: PowerShell - Base64

```powershell
# Generar key en Base64
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Opción 5: Bash/Linux/Mac - Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Opción 6: Bash/Linux/Mac - OpenSSL

```bash
openssl rand -hex 32
```

### Opción 7: Generador online

Ve a: https://www.uuidgenerator.net/api/guid (o cualquier generador de UUID/tokens)

### Opción 8: Crear tu propia key

Simplemente crea una cadena larga y aleatoria:
```
mi-super-secret-key-12345-abcdef-portfolio-2026
```

**⚠️ IMPORTANTE**: Guarda esta key en un lugar seguro. La necesitarás en dos lugares:
1. En tu portfolio (variable de entorno)
2. En GitHub (como secret)

## Paso 3: Configurar el Portfolio

Agrega la API key como variable de entorno en tu portfolio:

### Vercel

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega:
   - Name: `PORTFOLIO_API_KEY`
   - Value: `tu-api-key-generada`
4. Redeploy tu portfolio

### Netlify

1. Ve a tu sitio en Netlify
2. Site settings > Environment variables
3. Agrega:
   - Key: `PORTFOLIO_API_KEY`
   - Value: `tu-api-key-generada`
4. Redeploy

### Railway / Render / Otros

Similar: busca "Environment Variables" en la configuración y agrega `PORTFOLIO_API_KEY`

### Local (.env)

```bash
# .env
PORTFOLIO_API_KEY=tu-api-key-generada
```

## Paso 4: Configurar GitHub Secrets

Ahora configura los secrets en cada proyecto que use `da-proj`:

### 4.1 Ve a tu repositorio en GitHub

```
https://github.com/tu-usuario/tu-proyecto
```

### 4.2 Ve a Settings

Click en "Settings" (tab superior derecho)

### 4.3 Ve a Secrets and variables

En el menú lateral izquierdo:
- Secrets and variables > Actions

### 4.4 Agrega PORTFOLIO_API_URL

1. Click en "New repository secret"
2. Name: `PORTFOLIO_API_URL`
3. Value: La URL de tu portfolio (sin el path del endpoint)
   - Ejemplo: `https://tu-portfolio.vercel.app`
   - Ejemplo: `https://miportfolio.com`
4. Click "Add secret"

### 4.5 Agrega PORTFOLIO_API_KEY

1. Click en "New repository secret" otra vez
2. Name: `PORTFOLIO_API_KEY`
3. Value: La misma API key que generaste en el Paso 2
4. Click "Add secret"

## Paso 5: Verificar que funciona

### 5.1 Hacer un commit

```bash
# Edita algo en .project-metadata.mdx
git add .project-metadata.mdx
git commit -m "Test portfolio sync"
git push
```

### 5.2 Ver el workflow

1. Ve a la tab "Actions" en GitHub
2. Verás el workflow "Sync to Portfolio" ejecutándose
3. Click en él para ver los logs

### 5.3 Verificar logs

Si todo está bien, verás:
```
✓ Checkout code
✓ Setup Bun
✓ Extract metadata
✓ Notify Portfolio
✓ Create deployment badge
```

Si hay error, revisa:
- ¿Los secrets están bien configurados?
- ¿La API key es la misma en ambos lados?
- ¿La URL del portfolio es correcta?
- ¿El endpoint `/api/update-project` existe?

## Estructura de datos que recibe tu API

Tu endpoint recibirá un JSON con esta estructura:

```json
{
  "metadata": {
    "title": "Mi Proyecto",
    "category": "Web Development",
    "type": "featured",
    "status": "active",
    "age": "+2 months",
    "demo": "https://demo.com",
    "technologies": ["React", "TypeScript"],
    "images": {
      "cover": "/proj-images/cover.png",
      "gallery": ["/proj-images/screenshot1.png"]
    },
    "industry": "Technology",
    "timeline": "3 months",
    "details": ["Feature 1", "Feature 2"],
    "repository": {
      "owner": "tu-usuario",
      "name": "tu-proyecto",
      "url": "https://github.com/tu-usuario/tu-proyecto"
    },
    "lastCommit": "abc123...",
    "lastUpdated": "2026-01-13T19:30:00.000Z"
  },
  "markdown": "# Mi Proyecto\n\n## Description\n\n..."
}
```

## Troubleshooting

### Error: "Unauthorized"
- Verifica que la API key sea exactamente la misma en ambos lados
- Asegúrate de que el header sea `Authorization: Bearer TU_KEY`

### Error: "404 Not Found"
- Verifica que la URL del portfolio sea correcta
- Asegúrate de que el endpoint `/api/update-project` exista

### Error: "Network error"
- Verifica que tu portfolio esté desplegado y accesible
- Prueba hacer un curl manual:

```bash
curl -X POST https://tu-portfolio.com/api/update-project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-api-key" \
  -d '{"test": true}'
```

### El workflow no se ejecuta
- Verifica que el archivo esté en `.github/workflows/sync-portfolio.yml`
- Asegúrate de hacer push a `main` o `master`
- Verifica que hayas cambiado `.project-metadata.mdx` o archivos en `proj-images/`

## Alternativa: Sin API (Manual)

Si no quieres configurar un API, puedes:

1. **Eliminar el workflow** o comentar la parte de "Notify Portfolio"
2. **Usar los archivos manualmente**: Lee `.project-metadata.mdx` de cada proyecto y actualiza tu portfolio manualmente
3. **Script local**: Crea un script que lea todos tus proyectos y actualice el portfolio

## Seguridad

✅ **Buenas prácticas:**
- Usa HTTPS siempre
- Nunca compartas tu API key públicamente
- Usa una API key diferente para cada ambiente (dev, prod)
- Valida los datos que recibes en tu API
- Limita las peticiones (rate limiting)

❌ **No hagas:**
- Hardcodear la API key en el código
- Usar la misma key para múltiples servicios
- Compartir secrets en mensajes o emails

---

¿Necesitas ayuda? Revisa los logs del workflow en GitHub Actions para ver qué está fallando.
