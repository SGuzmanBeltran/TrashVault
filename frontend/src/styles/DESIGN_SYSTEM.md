# Trashvault Design System

## Filosofía

Dark-first, calm, spacious. Todo respira. Nada compite por atención.
El accent color es el único elemento vibrante — úsalo para CTAs, iconos activos y indicadores.

---

## Tokens de color

Se acceden como clases de Tailwind: `bg-surface`, `text-surface-fg`, etc.

### Superficies (backgrounds)

| Token                | Hex       | Uso                              |
|----------------------|-----------|----------------------------------|
| `surface`            | `#0a0a0f` | Fondo base de la app             |
| `surface-raised`     | `#12121a` | Cards, sidebar, paneles          |
| `surface-overlay`    | `#1a1a25` | Hover states, dropdowns internos |
| `surface-border`     | `#252535` | Bordes principales               |
| `surface-border-subtle` | `#1e1e2e` | Bordes suaves (dividers)      |

### Texto

| Token              | Hex       | Uso                                |
|--------------------|-----------|------------------------------------|
| `surface-fg`       | `#e8e8f0` | Texto principal                    |
| `surface-fg-muted` | `#8888a0` | Texto secundario, labels           |
| `surface-fg-subtle`| `#55556a` | Texto terciario, hints, placeholders|

### Accent (dinámico — cambia con el theme)

| Token          | Uso                                   |
|----------------|---------------------------------------|
| `accent`       | CTAs, iconos activos, links           |
| `accent-soft`  | Fondos sutiles (`bg-accent/10`)       |
| `accent-muted` | Selections, rings                     |
| `accent-fg`    | Texto sobre fondo accent              |

### Semánticos

| Token           | Uso                    |
|-----------------|------------------------|
| `success`       | Estado positivo        |
| `success-soft`  | Fondo suave success    |
| `warning`       | Advertencias           |
| `warning-soft`  | Fondo suave warning    |
| `danger`        | Eliminar, errores      |
| `danger-soft`   | Fondo suave danger     |

---

## Tipografía

**Fuente principal:** DM Sans
**Fuente monospace:** JetBrains Mono

| Clase               | Tamaño   | Peso     | Uso                          |
|----------------------|----------|----------|------------------------------|
| `text-2xl font-semibold tracking-tight` | 24px | 600 | Títulos de página |
| `text-xl font-semibold tracking-tight`  | 20px | 600 | Títulos de sección |
| `text-[15px] font-semibold tracking-tight` | 15px | 600 | Logo, branding |
| `text-sm font-medium`  | 14px  | 500 | Labels, nombres de archivo   |
| `text-sm`              | 14px  | 400 | Texto general                |
| `text-xs`              | 12px  | 400 | Metadatos, fechas, hints     |
| `text-[11px] font-medium uppercase tracking-wider` | 11px | 500 | Section headers |

---

## Espaciado

| Clase   | Valor | Uso típico                    |
|---------|-------|-------------------------------|
| `p-1`   | 4px   | Dropdown items                |
| `p-2`   | 8px   | Botones pequeños, icon buttons|
| `p-3`   | 12px  | Inputs, nav items             |
| `p-4`   | 16px  | Cards compactas               |
| `p-5`   | 20px  | Cards estándar                |
| `p-6`   | 24px  | Page content, secciones       |
| `gap-1` | 4px   | Separación mínima             |
| `gap-2` | 8px   | Icon + texto                  |
| `gap-3` | 12px  | Elementos en fila             |
| `gap-3.5` | 14px | Cards en grid                |
| `gap-4` | 16px  | Secciones                     |

---

## Bordes y radios

| Elemento          | Radio      | Borde                            |
|-------------------|------------|----------------------------------|
| Card / Panel      | `rounded-xl` (12px) | `border-surface-border` |
| Botón / Input     | `rounded-lg` (8px)  | `border-surface-border` |
| Icon container    | `rounded-lg` (8px)  | —                       |
| Avatar / Badge    | `rounded-full`      | —                       |
| Dropdown          | `rounded-xl`        | `border-surface-border` |

---

## Sombras

| Clase                    | Uso                      |
|--------------------------|--------------------------|
| `shadow-lg shadow-black/10` | Hover en cards         |
| `shadow-xl shadow-black/30` | Dropdowns, modals      |

---

## Animaciones

### Entrada de página
```html
<div class="animate-in">aparece con fadeSlideUp</div>
<div class="animate-in animate-stagger-1">delay 50ms</div>
<div class="animate-in animate-stagger-2">delay 100ms</div>
<!-- hasta animate-stagger-6 (300ms) -->
```

### Transición de dropdown/menu
```html
<Transition
  enter-active-class="transition duration-150 ease-out"
  enter-from-class="scale-95 opacity-0"
  enter-to-class="scale-100 opacity-100"
  leave-active-class="transition duration-100 ease-in"
  leave-from-class="scale-100 opacity-100"
  leave-to-class="scale-95 opacity-0"
>
  <div v-if="show">content</div>
</Transition>
```

### Skeleton loading
```html
<div class="skeleton h-4 w-40 rounded-md" />
```

---

## Patrones de componentes

### Card base
```html
<div class="rounded-xl border border-surface-border bg-surface-raised p-4 transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/10">
  <!-- content -->
</div>
```

### Card con selección
```html
<div
  class="rounded-xl border border-surface-border bg-surface-raised p-4 transition-all duration-200"
  :class="selected ? 'border-accent/40 ring-1 ring-accent/20' : ''"
>
```

### Icon container (colored)
```html
<div class="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
  <IconComponent class="h-5 w-5 text-accent" />
</div>
```

### Icon container (semantic color)
```html
<div class="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-400/10">
  <FileText class="h-5 w-5 text-blue-400" />
</div>
```

### Botón primary
```html
<button class="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-all hover:brightness-110 active:scale-[0.98]">
  <Icon class="h-4 w-4" />
  Label
</button>
```

### Botón secondary
```html
<button class="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
  <Icon class="h-4 w-4" />
  Label
</button>
```

### Botón ghost (icon only)
```html
<button class="rounded-lg p-2 text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
  <Icon class="h-4 w-4" />
</button>
```

### Botón danger
```html
<button class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft">
  <Trash2 class="h-4 w-4" />
  Delete
</button>
```

### Input
```html
<input
  type="text"
  placeholder="Placeholder..."
  class="w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-surface-fg placeholder-surface-fg-subtle outline-none transition-colors focus:border-accent/40 focus:ring-1 focus:ring-accent/20"
/>
```

### Label
```html
<label class="mb-1.5 block text-sm font-medium text-surface-fg">
  Label text
</label>
```

### Dropdown menu
```html
<div class="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30">
  <div class="border-b border-surface-border px-3 py-2.5">
    <div class="text-sm font-medium text-surface-fg">Title</div>
    <div class="text-xs text-surface-fg-subtle">Subtitle</div>
  </div>
  <div class="p-1">
    <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-fg-muted transition-colors hover:bg-surface-overlay hover:text-surface-fg">
      <Icon class="h-4 w-4" />
      Action
    </button>
    <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft">
      <Trash2 class="h-4 w-4" />
      Delete
    </button>
  </div>
</div>
```

### Separador de metadata (inline dots)
```html
<div class="flex items-center gap-2 text-xs text-surface-fg-subtle">
  <span>{{ value1 }}</span>
  <span class="h-0.5 w-0.5 rounded-full bg-surface-fg-subtle" />
  <span>{{ value2 }}</span>
</div>
```

### Section header (uppercase)
```html
<h3 class="text-xs font-medium uppercase tracking-wider text-surface-fg-subtle">
  Section Name
</h3>
```

### Progress bar
```html
<div class="h-2 overflow-hidden rounded-full bg-surface-overlay">
  <div class="h-full rounded-full bg-accent transition-all duration-500" :style="{ width: '45%' }" />
</div>
```

### Badge / Tag
```html
<span class="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
  Active
</span>
```

### Toggle switch
```html
<button class="relative h-6 w-11 rounded-full bg-accent">
  <span class="absolute left-[22px] top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
</button>
<!-- off state: bg-surface-border, left-0.5 -->
```

### Empty state
```html
<div class="flex flex-col items-center justify-center rounded-xl border-dashed border-surface-border py-16">
  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-overlay">
    <Upload class="h-5 w-5 text-surface-fg-subtle" />
  </div>
  <h3 class="mt-4 text-sm font-medium text-surface-fg">No items yet</h3>
  <p class="mt-1 text-sm text-surface-fg-subtle">Description of what to do</p>
</div>
```

---

## Template de componente nuevo

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SomeIcon } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()

const emit = defineEmits<{
  action: [id: string]
}>()
</script>

<template>
  <div class="rounded-xl border border-surface-border bg-surface-raised p-4 transition-all duration-200 hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/10">
    <div class="flex items-start justify-between">
      <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
        <SomeIcon class="h-5 w-5 text-accent" />
      </div>
    </div>

    <div class="mt-3.5 min-w-0 flex-1">
      <div class="truncate text-sm font-medium text-surface-fg">
        {{ title }}
      </div>
      <p v-if="description" class="mt-1 text-xs text-surface-fg-subtle">
        {{ description }}
      </p>
    </div>
  </div>
</template>
```

---

## Reglas

1. **Nunca** uses `bg-white`, `text-black`, o colores hardcodeados.
2. **Siempre** usa los tokens `surface-*`, `accent`, `danger`, etc.
3. **Siempre** incluye `transition-all duration-200` o `transition-colors` en elementos interactivos.
4. **Dropdowns** siempre: `rounded-xl border border-surface-border bg-surface-raised shadow-xl shadow-black/30`.
5. **Hover en cards**: `hover:border-surface-border/80 hover:shadow-lg hover:shadow-black/10`.
6. **Iconos**: siempre Lucide (`lucide-vue-next`), tamaño `h-4 w-4` (botones) o `h-5 w-5` (cards).
7. **Staggered animations**: usa `animate-in` + `animate-stagger-N` para listas y grids.
8. **Skeletons**: usa la clase `.skeleton` para loading states.
