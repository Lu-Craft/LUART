---
name: Aprender Nuevas Habilidades (Skill Learning Framework)
description: Habilidad fundacional encargada de gestionar cómo se aprende y documenta cualquier nueva habilidad (skill) solicitada por el usuario. Garantiza un estándar de máxima calidad, rigurosidad, uso de documentación y registro libre de errores.
---

# 🧠 Aprender Nuevas Habilidades (Skill Learning Framework)

Esta habilidad se activa automáticamente cuando el usuario solicita que se "aprenda una nueva habilidad" o se configure una nueva capacidad dentro del proyecto. Su objetivo es asegurar que el proceso de aprendizaje sea **riguroso, profesional, documentado y sin errores**.

## 🎯 Objetivo Principal
Garantizar que toda nueva habilidad adquirida sea de la **mayor calidad posible**, basándose siempre en fuentes oficiales (documentación) y estructurándose de forma lógica y modular en el directorio correcto.

## 📋 Proceso Paso a Paso (Instrucciones)

Cuando el usuario pida aprender una nueva habilidad, DEBES seguir estrictamente este flujo de trabajo:

### 1. 📥 Recepción y Confirmación
- Escucha atentamente la descripción o recibe las fuentes (URLs, PDFs, ejemplos de código) proporcionadas por el usuario.
- **Antes de escribir código:** Si la habilidad requiere un marco de trabajo o librería específica, utiliza la herramienta `search_web` o `read_url_content` para leer la **documentación oficial más reciente**. NUNCA asumas sintaxis obsoletas.

### 2. 🔍 Planificación (Planning Mode)
- Inicia el modo de planificación (`task_boundary` en modo `PLANNING`).
- Desglosa la nueva habilidad en pasos lógicos dentro de tu archivo `task.md`.
- Escribe un `implementation_plan.md` resumiendo cómo se estructurará la habilidad.

### 3. 🏗️ Creación de la Habilidad (Execution)
- Navega al directorio raíz del proyecto y asegúrate de que exista la carpeta `skills`. Si no existe, créala.
- Cada nueva habilidad debe tener su propia carpeta descriptiva dentro de `skills/` (ej. `skills/optimization_seo/`).
- **Archivo Principal:** Dentro de esa carpeta, SIEMPRE debes crear el archivo `SKILL.md`.
- **Plantilla Obligatoria para `SKILL.md`:** Todo archivo `SKILL.md` DEBE contener el Frontmatter en YAML:

\`\`\`yaml
---
name: [Nombre legible de la habilidad]
description: [Descripción corta y concisa de para qué sirve y cuándo usarla]
---
\`\`\`

- **Contenido del `SKILL.md`:** Debe proporcionar instrucciones detalladas, en formato markdown limpio (Markdown de GitHub), explicando:
  - Cuándo se debe aplicar.
  - El flujo de trabajo exacto (paso a paso).
  - Casos extremos o advertencias (Alertas de GitHub).
  - Componentes o dependencias necesarias.

### 4. 🧩 Archivos Complementarios (Opcional)
- Si la habilidad es compleja, puedes crear las subcarpetas necesarias (`scripts/`, `examples/`, `resources/`) junto al archivo `SKILL.md`.

### 5. ✅ Verificación (Verification Mode)
- **Revisión Rigurosa:** Lee el documento `SKILL.md` creado utilizando la herramienta `view_file` para asegurar que el Frontmatter es correcto y el texto no contiene errores tipográficos o lógicos.
- **Confirmación Final:** Notifica al usuario mediante `notify_user` usando el contexto adecuado, solicitando revisión del archivo si es crítico, o confirmando que la habilidad ha sido interiorizada exitosamente.

---
> [!IMPORTANT]  
> **Seguridad y Actualidad:** Valida siempre la tecnología a aprender contra su versión más reciente. El objetivo de esta habilidad es evitar crear código defectuoso o "sucio".
