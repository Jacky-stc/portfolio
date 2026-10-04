// Import this helper into an existing Three.js project after loading the GLB.
// Call setLamp(gltf.scene, 'Lamp_Pendant_01', false).
// Separate emissive materials are supplied for all seven lamp groups.
import { Light, Mesh, MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial } from 'three'
import type { Object3D, Material } from 'three'
const originalIntensity = new WeakMap<Light, number>()
const originalEmission = new WeakMap<Material, number>()

export const lampNames = [
  'Lamp_Pendant_01',
  'Lamp_Pendant_02',
  'Lamp_Pendant_03',
  'Lamp_Table_Cylinder',
  'Lamp_Table_Orb',
  'Lamp_Shelf',
  'Lamp_Stair_LED',
]

export function setLamp(root: Object3D, name: string, on: boolean) {
  const group = root.getObjectByName(name)
  if (!group || !lampNames.includes(name)) throw new Error(`Unknown lamp: ${name}`)
  group.traverse((object) => {
    if (object instanceof Light) {
      if (!originalIntensity.has(object)) originalIntensity.set(object, object.intensity)
      object.intensity = on ? (originalIntensity.get(object) ?? object.intensity) : 0
    }
    if (object instanceof Mesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (
          !(material instanceof MeshStandardMaterial || material instanceof MeshPhongMaterial || material instanceof MeshLambertMaterial) ||
          material.emissive.getHex() === 0
        )
          continue
        if (!originalEmission.has(material)) originalEmission.set(material, material.emissiveIntensity)
        material.emissiveIntensity = on ? (originalEmission.get(material) ?? material.emissiveIntensity) : 0
      }
    }
  })
  group.userData.isOn = Boolean(on)
}

export function setAllLamps(root: Object3D, on: boolean) {
  for (const name of lampNames) setLamp(root, name, on)
}
