# 3D models (vendored)

These glTF binary (`.glb`) assets are bundled locally and served from `/models/...`.
They are loaded by the ballroom 3D preview (`components/layout-editor/ballroom-3d`).

All files were downloaded once from the official **Khronos glTF Sample Assets**
repository and reviewed before committing. We do **not** load models from remote
URLs at runtime — only from this folder.

| File | Used for | Source | License | Credit | SHA-256 |
|------|----------|--------|---------|--------|---------|
| `furniture/SheenChair.glb` | `chair` | [KhronosGroup/glTF-Sample-Assets · SheenChair](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenChair) | [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/legalcode) (public domain) | © 2020 Wayfair, LLC — Eric Chadwick | `f0af2a2b102d28d540236306ae19f8fb36842df76bd38cf76f063f9bd2853399` |
| `furniture/SheenWoodLeatherSofa.glb` | `lounge_sofa` | [KhronosGroup/glTF-Sample-Assets · SheenWoodLeatherSofa](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenWoodLeatherSofa) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode) | © 2024 Darmstadt Graphics Group GmbH; original © 2021 Fran Calvente (CC0); Eric Chadwick (improvements) | `5349e042ad41e695e89f1110230c4ee0c75b2bc62ef830c7016be6ecf665bfb6` |
| `furniture/kenney-desk.glb` | `registration_table` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) via [Poly Pizza](https://poly.pizza/m/6PbVkqPzEU) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) | Kenney.nl | `ec34cdca21215d1cb90a3c63eec1d1d1a3b8592043783c67184158490c34b4f1` |
| `furniture/kenney-kitchen-bar.glb` | `bar_area` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) via [Poly Pizza](https://poly.pizza/m/w00V8SbhYD) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) | Kenney.nl | `ec24557b542c996835294841297d82388c7f5fe1b10ade836fe39454272f9904` |
| `furniture/kenney-bench.glb` | `church_pew` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) via [Poly Pizza](https://poly.pizza/m/vfKIesr9bk) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) | Kenney.nl | `d4f35ac8829a0dc9455b3d3d61cb517d2a896153874d38b0d68ff831a77f0c5f` |
| `furniture/kenney-potted-plant.glb` | `plant_decor` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) via [Poly Pizza](https://poly.pizza/m/23Dx9CC95C) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) | Kenney.nl | `533b5588b34e57ec27c72dcfc6a4dc76b8b39b48fff808e745dbb201842d6643` |
| `furniture/kenney-plant-small.glb` | `flower_stand` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) via [Poly Pizza](https://poly.pizza/m/4f6vwL8vo9) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/legalcode) | Kenney.nl | `b856d5a38a8343ec7dc43921dfcc49af8614afbb91d16ef0a18d7ca99a26801c` |

## Attribution requirement

`SheenWoodLeatherSofa.glb` is **CC BY 4.0**, so its credit must be shown to end
users. The app surfaces this in the 3D preview footer. `SheenChair.glb` is CC0
and needs no attribution, but we credit it anyway.

## Required glTF extensions

Both load with the stock three.js `GLTFLoader` — no DRACO, KTX2/Basis, or meshopt
transcoders. Extensions in use: `KHR_materials_sheen`, `KHR_materials_specular`,
`KHR_texture_transform`, `KHR_materials_variants`, `EXT_texture_webp` (all natively supported).

## Adding new models

1. Only vendor assets with a clear license (prefer CC0; CC BY requires attribution).
2. Download once, commit the file here, and record source + license + credit + SHA-256 above.
3. Never point the loader at a mutable remote URL in production.
