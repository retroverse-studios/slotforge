# SlotForge Fab

Export service for turning a track file into physical parts. Scaffold for now:
the 1:1 print sheet and SVG export live in Studio.

## Planned CLI

```bash
slotforge-fab print  content/tracks/door-oval.afxtrack.json --paper a4 --out build/
slotforge-fab svg    content/tracks/door-oval.afxtrack.json --out build/
slotforge-fab dxf    content/tracks/door-oval.afxtrack.json --out build/
slotforge-fab stl    content/tracks/door-oval.afxtrack.json --out build/
slotforge-fab bom    content/tracks/door-oval.afxtrack.json
```

## Formats

| Format | Use |
|---|---|
| PDF, multi-page | Print at 1:1, tiled with registration marks |
| SVG | Laser cut, vinyl cut, further editing |
| DXF | CNC router or laser |
| GLB | 3D preview and scene layout |
| STL/STEP | Risers, supports, clips |
| CSV | BOM for ordering |

## Refactor target

Move `apps/studio/src/lib/render.ts` into a shared package so the editor and the
CLI produce identical output. One renderer, one set of units, one calibration
square.
