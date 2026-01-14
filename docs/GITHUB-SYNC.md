# GitHub Sync - Guía de Usuario

## 🎯 ¿Qué es GitHub Sync?

GitHub Sync te permite sincronizar tu configuración de `da-proj` (perfiles con API keys y URLs) entre múltiples dispositivos usando un repositorio privado de GitHub.

**Ventajas:**

- ✅ Sincroniza entre PCs automáticamente
- ✅ Backup gratis en GitHub
- ✅ No necesitas servicios de nube externos
- ✅ Control total sobre tus datos

---

## 🚀 Configuración Inicial

### Paso 1: Setup GitHub Sync

```bash
bunx da-proj --setup-github-sync
```

**Opciones:**

1. **Crear nuevo repo privado** (Recomendado)

   - Crea un repo privado en tu cuenta de GitHub
   - Nombre sugerido: `da-proj-secrets`

2. **Usar repo existente**
   - Muestra lista de tus repos privados
   - Selecciona uno existente

**Resultado:** Se crea el archivo `~/.da-proj-github-config` con la configuración del repo.

---

## 📤 Subir Configuración (Push)

Sube tu configuración local a GitHub:

```bash
bunx da-proj --push
```

**Qué hace:**

1. Lee `~/.da-proj-config.json` (local)
2. Sube el contenido a GitHub
3. Archivo en GitHub: `da-proj-config.json`

**Cuándo usarlo:**

- Después de crear/modificar perfiles
- Antes de cambiar de PC
- Como backup

---

## 📥 Descargar Configuración (Pull)

Descarga configuración desde GitHub:

```bash
bunx da-proj --pull
```

**Qué hace:**

1. Descarga `da-proj-config.json` desde GitHub
2. Guarda en `~/.da-proj-config.json` (local)

**Si ya existe configuración local:**

- **Replace:** Sobrescribe local con GitHub
- **Merge:** Combina perfiles de ambos
- **Cancel:** Cancela la operación

**Cuándo usarlo:**

- En una PC nueva
- Para sincronizar cambios de otra PC
- Para restaurar backup

---

## 📊 Ver Estado de Sincronización

Compara configuración local vs GitHub:

```bash
bunx da-proj --sync-status
```

**Muestra:**

- ✓ Sincronizado - Local y GitHub son idénticos
- ⚠️ Out of sync - Hay diferencias
- Número de perfiles en cada lado
- Sugerencias de qué hacer

---

## 🔄 Flujo de Trabajo Típico

### En PC 1 (Primera vez)

```bash
# 1. Crear perfiles
bunx da-proj --secrets
# → Crea perfil "main"

# 2. Configurar GitHub sync
bunx da-proj --setup-github-sync
# → Crea repo "da-proj-secrets"

# 3. Subir a GitHub
bunx da-proj --push
# → ✓ Configuración en la nube
```

### En PC 2 (Laptop)

```bash
# 1. Configurar GitHub sync
bunx da-proj --setup-github-sync
# → Conecta al repo "da-proj-secrets"

# 2. Descargar configuración
bunx da-proj --pull
# → ✓ Ya tienes perfil "main"

# 3. Usar normalmente
bunx da-proj --secrets
# → Muestra perfil "main"
```

### Sincronizar cambios

```bash
# En PC 1: Crear nuevo perfil
bunx da-proj --secrets
# → Crea perfil "work"

bunx da-proj --push
# → Sube a GitHub

# En PC 2: Descargar cambios
bunx da-proj --pull
# → ✓ Ahora tienes "main" y "work"
```

---

## 🤔 Preguntas Frecuentes

### ¿Qué archivos se crean?

**En tu PC:**

- `~/.da-proj-config.json` - Configuración local (siempre se usa este)
- `~/.da-proj-github-config` - Info del repo de GitHub

**En GitHub:**

- `da-proj-config.json` - Copia de tu configuración
- `README.md` - Explicación del repo

### ¿Es seguro?

**Sí, si:**

- ✅ El repo es privado (el CLI lo fuerza)
- ✅ Tienes 2FA habilitado en GitHub
- ✅ Solo tú tienes acceso al repo

**Recomendaciones:**

- Mantén el repo privado
- No compartas el repo con otros
- Usa tokens de GitHub con permisos mínimos

### ¿Qué pasa si hago cambios en 2 PCs sin sincronizar?

1. `--sync-status` te avisará que hay conflicto
2. `--pull` te preguntará qué hacer:
   - Replace (sobrescribir)
   - Merge (combinar)
   - Cancel

### ¿Puedo usar el CLI sin GitHub sync?

**Sí, totalmente.** GitHub sync es opcional. Si no lo configuras, todo funciona normal con el archivo local.

### ¿Qué pasa si borro el archivo local?

Fácil: `bunx da-proj --pull` y lo recuperas desde GitHub.

### ¿Qué pasa si borro el repo de GitHub?

No pasa nada. Tienes copia local. Puedes crear nuevo repo y hacer `--push`.

### ¿Cómo desactivo GitHub sync?

Borra el archivo `~/.da-proj-github-config`:

```bash
# Windows
del %USERPROFILE%\.da-proj-github-config

# Linux/Mac
rm ~/.da-proj-github-config
```

---

## 🔧 Troubleshooting

### Error: "GitHub sync not configured"

**Solución:** Ejecuta `bunx da-proj --setup-github-sync`

### Error: "GitHub CLI not installed"

**Solución:**

```bash
# Windows
winget install --id GitHub.cli

# Después autenticar
gh auth login
```

### Error: "No configuration found in GitHub"

**Solución:** Sube tu configuración con `bunx da-proj --push`

### Error: "Failed to download"

**Causas posibles:**

- No tienes internet
- El repo no existe
- No tienes permisos

**Solución:** Verifica que el repo exista y tengas acceso.

---

## 📋 Resumen de Comandos

| Comando               | Descripción                       |
| --------------------- | --------------------------------- |
| `--setup-github-sync` | Configurar repo de GitHub         |
| `--push`              | Subir configuración a GitHub      |
| `--pull`              | Descargar configuración de GitHub |
| `--sync-status`       | Ver estado de sincronización      |

---

## 💡 Tips

1. **Usa --sync-status** antes de hacer push/pull para ver qué va a pasar
2. **Haz push** después de crear/modificar perfiles
3. **Haz pull** al empezar a trabajar en una PC nueva
4. **El merge** es útil cuando trabajas en múltiples PCs
5. **GitHub sync es opcional** - funciona sin configurarlo

---

¿Necesitas ayuda? Revisa la documentación completa en el repositorio.
