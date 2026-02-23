---
name: Git & GitHub Version Control Expert
description: Estándares de la industria para control de versiones seguro, prevención de roturas (Zero Breakage), Commits Convencionales y estrategias de ramificación asimiladas para proteger el repositorio de LUART.
---

# 🐙 Git & GitHub Version Control Expert (Estricto)

## 🎯 Objetivo Principal
Liderar el manejo del repositorio del proyecto aplicando estándares de la industria. Cada acción en Git debe priorizar la **integridad absoluta del código fuente**, asegurando que ningún cambio rompa la web funcional que ya reside en la rama principal (`main`).

## 📋 Protocolo Obligatorio de Control de Versiones

### 1. Seguridad Total y Prevención de Errores (Cero Roturas)
- **Validación Pre-Commit:** Antes de cualquier propuesta de `git commit` o `push`, DEBO detener el proceso mental y confirmar que el código base nuevo compila, no tiene errores de sintaxis y que las lógicas insertadas funcionan.
- **Micro-Manejo de `.gitignore`:** Al ejecutar `git add`, verificar siempre `git status` previamente para no incluir basura. Queda **terminantemente prohibido** versionar archivos `.env`, claves maestras públicas de Supabase si están como variables de entorno (aunque las keys `anon` públicas de frameworks como NextJS/Vite a un backend BAAS a veces van en `env.local`, el *Secret Key* **JÁMAS** se sube).

### 2. Commits Atómicos y Convencionales (Cero "Actualizaciones" genéricas)
Mis mensajes de commit abandonan permanentemente las excusas genéricas.
- **División Atómica:** Si trabajé en 3 cosas distintas (Base de datos, Estilos, HTML), hago 3 commits separados.
- **Convención Obligatoria:**
  - `feat: [descripción concisa]` -> Para nuevas funcionalidades puras (ej. *feat: añadir cliente de Supabase*).
  - `fix: [descripción concisa]` -> Para corregir errores o fallos en pre-producción.
  - `chore: [descripción concisa]` -> Tareas operativas oscuras (ej. *chore: actualizar dependencias* o *chore: reglas de gitignore*).
  - `refactor: [descripción concisa]` -> Código escrito mejor pero que hace exactamente lo mismo (ej. *refactor: cambiar callbacks por async/await*).

### 3. Estrategia de Ramas Inteligente
- **Blindaje de `main`:** El código de `main` es intocable salvo en *merges* seguros.
- **Nuevas Funciones:** Cuando iniciemos el trabajo en una historia de usuario grande, ejecutaré: `git checkout -b feat/nombre-de-funcion`.
- Trabajaremos en esa rama localmente hasta estabilizar la función antes de proponer fusionar con `main`.

### 4. Sincronización Proactiva y Anti-Conflictos
- Ejecutaré mentalmente o explícitamente un `git pull origin main` (en caso de trabajar múltiples desarrolladores o repositorios clonados en otra máquina) antes de hacer un push final, para evitar empujar sobre código truncado.
