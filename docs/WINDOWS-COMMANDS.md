# Comandos Útiles para Windows/PowerShell

## Generar API Key

### Método 1: Comando completo (Recomendado)
```powershell
[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower()
```

**Resultado:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Método 2: Usando GUID (más simple)
```powershell
(New-Guid).Guid.Replace("-","")
```

**Resultado:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Método 3: Base64
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Resultado:** `Xk7+9mP2qR8vN3wL5tY1zH4jK6sA0bC8dE2fG9hI7uJ=`

### Método 4: Usar el script incluido
```powershell
pwsh -File generate-api-key.ps1
```

o con npm:
```powershell
npm run generate-key:ps
```

## Copiar al Portapapeles

Para copiar directamente al portapapeles:

```powershell
[System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower() | Set-Clipboard
Write-Host "✓ API Key copiada al portapapeles!"
```

## Guardar en Archivo

Para guardar la key en un archivo:

```powershell
$apiKey = [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower()
$apiKey | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "PORTFOLIO_API_KEY=$apiKey"
```

## Crear archivo .env completo

```powershell
$apiKey = [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower()
@"
# Portfolio API Configuration
PORTFOLIO_API_KEY=$apiKey
PORTFOLIO_API_URL=https://tu-portfolio.com
"@ | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✓ Archivo .env creado con la API key"
```

## Verificar si un comando existe

```powershell
# Verificar si Bun está instalado
Get-Command bun -ErrorAction SilentlyContinue

# Verificar si Node está instalado
Get-Command node -ErrorAction SilentlyContinue

# Verificar si Git está instalado
Get-Command git -ErrorAction SilentlyContinue
```

## Comandos equivalentes a Bash

| Bash | PowerShell |
|------|------------|
| `ls` | `Get-ChildItem` o `ls` |
| `cd` | `Set-Location` o `cd` |
| `pwd` | `Get-Location` o `pwd` |
| `cat file.txt` | `Get-Content file.txt` o `cat file.txt` |
| `rm file.txt` | `Remove-Item file.txt` o `rm file.txt` |
| `mkdir folder` | `New-Item -ItemType Directory folder` o `mkdir folder` |
| `cp src dst` | `Copy-Item src dst` o `cp src dst` |
| `mv src dst` | `Move-Item src dst` o `mv src dst` |
| `echo "text"` | `Write-Host "text"` o `echo "text"` |
| `grep pattern` | `Select-String pattern` |
| `find . -name "*.js"` | `Get-ChildItem -Recurse -Filter "*.js"` |

## Alias útiles para PowerShell

Agrega estos a tu perfil de PowerShell (`$PROFILE`):

```powershell
# Abrir el perfil
notepad $PROFILE

# Agregar estos alias:
function genkey { [System.BitConverter]::ToString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace("-","").ToLower() }
function genkey-copy { genkey | Set-Clipboard; Write-Host "✓ Key copiada!" }

Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name which -Value Get-Command
```

Después de guardar, recarga el perfil:
```powershell
. $PROFILE
```

Ahora puedes usar:
```powershell
genkey          # Genera una key
genkey-copy     # Genera y copia al portapapeles
```

## Tips de PowerShell

### Ejecutar como Administrador
```powershell
Start-Process pwsh -Verb RunAs
```

### Ver historial de comandos
```powershell
Get-History
```

### Limpiar pantalla
```powershell
Clear-Host
# o simplemente:
cls
```

### Ver variables de entorno
```powershell
Get-ChildItem Env:
```

### Establecer variable de entorno (sesión actual)
```powershell
$env:PORTFOLIO_API_KEY = "tu-key-aqui"
```

### Establecer variable de entorno (permanente)
```powershell
[System.Environment]::SetEnvironmentVariable("PORTFOLIO_API_KEY", "tu-key-aqui", "User")
```

## Ejecutar scripts de Bun/Node en PowerShell

```powershell
# Ejecutar con Bun
bun run index.ts

# Ejecutar con Node
node index.js

# Ejecutar npm scripts
npm run dev
npm run build

# Instalar dependencias
bun install
# o
npm install
```

## Troubleshooting

### Error: "no se puede cargar el archivo porque la ejecución de scripts está deshabilitada"

Solución:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "comando no encontrado"

Verifica que el programa esté instalado:
```powershell
Get-Command nombre-comando
```

Si no está, instálalo y asegúrate de que esté en el PATH.

---

¡Ahora tienes todos los comandos que necesitas para Windows! 🚀
