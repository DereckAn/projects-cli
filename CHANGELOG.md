# Changelog

## [1.1.0] - 2026-01-14

### Added

- 🚀 GitHub Actions workflow para publicación automática en npm
- 📖 Documentación completa en `docs/NPM-PUBLISH.md`
- 🏷️ Creación automática de git tags al publicar
- ✅ Detección automática de cambios de versión
- 🎥 **Nuevo campo `videos`** para agregar URLs de YouTube a los proyectos
- 🔍 **Detección inteligente de archivos existentes**: El comando `--init` ahora detecta si ya existe `.project-metadata.mdx`
- 🛡️ **Protección de contenido**: Opción para actualizar solo schema/workflow sin sobrescribir contenido existente
- 🎨 **Manejo elegante de Ctrl+C**: Mensaje amigable cuando se cancela el proceso

### Changed

- 📝 README actualizado con instrucciones de publicación
- 🔄 Proceso de publicación ahora completamente automatizado
- ⚙️ Schema JSON actualizado con soporte para videos
- 🎯 Comando `--init` mejorado con opciones interactivas cuando se ejecuta en proyectos existentes

### Fixed

- 🐛 Prevención de sobrescritura accidental de metadata existente

## [1.0.0] - 2026-01-13

### Added

- ✅ Carpeta `proj-images/` se crea automáticamente (nombre específico para evitar confusión)
- ✅ Archivo `proj-images/README.md` con instrucciones para el usuario
- ✅ Archivo `proj-images/.gitkeep` para que git trackee la carpeta vacía
- ✅ Lista de imágenes necesarias en el README de proj-images/
- ✅ Mejores mensajes en "Next steps" mostrando qué imágenes agregar
- ✅ Default path actualizado a `/proj-images/cover.png`

### Changed

- 🔄 Nombre del comando: `create-project-meta` → `da-proj`
- 🔄 Reemplazadas funciones de input custom por `@inquirer/prompts`
- 🔄 Input de tecnologías y detalles ahora usa comma-separated en lugar de línea por línea

### Fixed

- 🐛 Arreglado problema con `Bun.stdin.read()`
- 🐛 Eliminado import `join` no usado
- 🐛 Eliminado parámetro `portfolioUrl` no usado
- 🐛 Arreglados tipos de TypeScript
- 🐛 Eliminado import `checkbox` no usado

## Estructura de archivos generados

Cuando ejecutas `bunx da-proj --init`, se crean:

```
tu-proyecto/
├── .project-metadata.mdx       ← Metadata del proyecto
├── .project-schema.json        ← Schema de validación
├── .github/
│   └── workflows/
│       └── sync-portfolio.yml  ← GitHub Actions workflow
├── proj-images/
│   ├── README.md               ← Instrucciones para imágenes
│   └── .gitkeep                ← Para trackear carpeta vacía
└── README.md                   ← README profesional (si no existe)
```

## Próximas mejoras sugeridas

- [ ] Validar que las URLs sean válidas
- [ ] Opción para generar imágenes placeholder
- [ ] Soporte para múltiples idiomas
- [ ] Template customizable para el MDX
- [ ] Comando para actualizar metadata existente
- [ ] Integración con APIs de imágenes (Unsplash, etc.)
