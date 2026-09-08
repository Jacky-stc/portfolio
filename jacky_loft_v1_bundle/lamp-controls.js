// Import this helper into an existing Three.js project after loading the GLB.
// Call setLamp(gltf.scene, 'Lamp_Pendant_01', false).
// Separate emissive materials are supplied for all seven lamp groups.
const originalIntensity = new WeakMap();
const originalEmission = new WeakMap();

export const lampNames = [
  'Lamp_Pendant_01', 'Lamp_Pendant_02', 'Lamp_Pendant_03',
  'Lamp_Table_Cylinder', 'Lamp_Table_Orb', 'Lamp_Shelf', 'Lamp_Stair_LED',
];

export function setLamp(root, name, on) {
  const group = root.getObjectByName(name);
  if (!group || !lampNames.includes(name)) throw new Error(`Unknown lamp: ${name}`);
  group.traverse((object) => {
    if (object.isLight) {
      if (!originalIntensity.has(object)) originalIntensity.set(object, object.intensity);
      object.intensity = on ? originalIntensity.get(object) : 0;
    }
    if (object.isMesh) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material.emissive || material.emissive.getHex() === 0) continue;
        if (!originalEmission.has(material)) originalEmission.set(material, material.emissiveIntensity);
        material.emissiveIntensity = on ? originalEmission.get(material) : 0;
      }
    }
  });
  group.userData.isOn = Boolean(on);
}

export function setAllLamps(root, on) {
  for (const name of lampNames) setLamp(root, name, on);
}
