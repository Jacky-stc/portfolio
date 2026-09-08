import { Billboard, ContactShadows, Html, Line, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

const MODEL_PATH = '/models/jacky_loft_v1.glb?v=0.5.1'
const SCALE_EPSILON = 0.0001
const BASE_CAMERA_FOV = 32
const BASE_CAMERA_ASPECT = 16 / 9
const BASE_CAMERA_POSITION = new THREE.Vector3(9.5, 6.5, 11.5)
const CAMERA_TARGET = new THREE.Vector3(0, 0.45, 0)

function ResponsiveCamera() {
  const { camera, size, invalidate } = useThree()

  useEffect(() => {
    const canvasAspect = size.width / size.height
    const rawHorizontalFit = Math.max(1, BASE_CAMERA_ASPECT / canvasAspect)
    const horizontalFit = 1 + (rawHorizontalFit - 1) * 0.7
    const balancedFit = Math.sqrt(horizontalFit)
    const verticalFov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_CAMERA_FOV) / 2) * balancedFit))
    const cameraOffset = BASE_CAMERA_POSITION.clone().sub(CAMERA_TARGET).multiplyScalar(balancedFit)

    camera.position.copy(CAMERA_TARGET).add(cameraOffset)
    camera.fov = verticalFov
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate, size.height, size.width])

  return null
}

const HOTSPOTS = [
  {
    anchorNode: 'Hotspot_Bookshelf',
    groupName: 'Bookshelf',
    interactionId: 'past-experience',
    label: 'Past Experience',
    labelSide: 'left',
    offset: [-0.9, 0.7, 0.1],
  },
  {
    anchorNode: 'Hotspot_TV',
    groupName: 'TV',
    interactionId: 'side-projects',
    label: 'Side Projects',
    labelSide: 'right',
    offset: [0.97, 0.67, 0.1],
  },
]

function findInteractiveParent(object) {
  let current = object

  while (current) {
    if (current.userData?.interactive) return current
    current = current.parent
  }

  return null
}

function navigateToSection(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function HotspotIndicator({ anchor, hotspot, isActive, onHover }) {
  const start = useMemo(() => new THREE.Vector3(...anchor), [anchor])
  const end = useMemo(() => start.clone().add(new THREE.Vector3(...hotspot.offset)), [hotspot.offset, start])
  const lineGeometry = useMemo(() => {
    const direction = end.clone().sub(start)
    const midpoint = start.clone().add(end).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())

    return { length: direction.length(), midpoint, quaternion }
  }, [end, start])

  const activate = (event) => {
    event.stopPropagation()
    navigateToSection(hotspot.interactionId)
  }

  const activateHover = (event) => {
    event.stopPropagation()
    onHover(hotspot.interactionId)
  }

  return (
    <group>
      <Line
        points={[start, end]}
        color="#ffffff"
        lineWidth={isActive ? 2 : 1.25}
        transparent
        opacity={isActive ? 1 : 0.76}
        depthTest={false}
        renderOrder={10}
      />

      <mesh
        position={lineGeometry.midpoint}
        quaternion={lineGeometry.quaternion}
        onClick={activate}
        onPointerOver={activateHover}
        onPointerOut={() => onHover(null)}
      >
        <cylinderGeometry args={[0.1, 0.1, lineGeometry.length, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <Billboard position={start}>
        <mesh
          scale={isActive ? 1.4 : 1}
          onClick={activate}
          onPointerOver={activateHover}
          onPointerOut={() => onHover(null)}
        >
          <circleGeometry args={[0.075, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            depthTest={false}
          />
        </mesh>
        <mesh scale={isActive ? 1.3 : 1}>
          <ringGeometry args={[0.12, 0.145, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={isActive ? 0.85 : 0.35}
            depthTest={false}
          />
        </mesh>
      </Billboard>

      <Html
        position={end}
        zIndexRange={[20, 10]}
      >
        <button
          className={`hotspot-label hotspot-label--${hotspot.labelSide} ${isActive ? 'is-active' : ''}`}
          type="button"
          onClick={() => navigateToSection(hotspot.interactionId)}
          onPointerEnter={() => onHover(hotspot.interactionId)}
          onPointerLeave={() => onHover(null)}
        >
          {hotspot.label}
        </button>
      </Html>
    </group>
  )
}

function InteractionHitbox({ interactionId, center, size, onHover }) {
  const activate = (event) => {
    event.stopPropagation()
    navigateToSection(interactionId)
  }

  const activateHover = (event) => {
    if (event.intersections[0]?.object !== event.object) return

    event.stopPropagation()
    onHover(interactionId)
  }

  return (
    <mesh
      position={center}
      onClick={activate}
      onPointerMove={activateHover}
      onPointerOver={activateHover}
      onPointerOut={() => onHover(null)}
    >
      <boxGeometry args={size} />
      <meshBasicMaterial
        transparent
        opacity={0}
        colorWrite={false}
        depthWrite={false}
      />
    </mesh>
  )
}

function LoftModel({ hoveredId, onHover }) {
  const { scene } = useGLTF(MODEL_PATH)

  const hotspotAnchors = useMemo(() => {
    scene.updateMatrixWorld(true)

    return HOTSPOTS.map((hotspot) => {
      const node = scene.getObjectByName(hotspot.anchorNode)

      if (!node) {
        console.warn(`Missing interaction anchor: ${hotspot.anchorNode}`)
        return null
      }

      return {
        hotspot,
        anchor: node.getWorldPosition(new THREE.Vector3()).toArray(),
      }
    }).filter(Boolean)
  }, [scene])

  const interactiveObjects = useMemo(() => {
    scene.updateMatrixWorld(true)

    return HOTSPOTS.map((hotspot) => {
      const object = scene.getObjectByName(hotspot.groupName)
      if (!object) return null

      const worldCenter = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3())
      const bounds = new THREE.Box3().setFromObject(object).expandByScalar(0.08)
      const localCenter = object.worldToLocal(worldCenter.clone())

      return {
        interactionId: hotspot.interactionId,
        object,
        localCenter,
        basePosition: object.position.clone(),
        baseScale: object.scale.x,
        hitboxCenter: bounds.getCenter(new THREE.Vector3()).toArray(),
        hitboxSize: bounds.getSize(new THREE.Vector3()).toArray(),
      }
    }).filter(Boolean)
  }, [scene])

  useEffect(() => {
    scene.traverse((object) => {
      if (object.isLight) object.castShadow = false

      if (object.isMesh) {
        object.castShadow = false
        object.receiveShadow = true
      }
    })
  }, [scene])

  useFrame(({ invalidate }, delta) => {
    const easing = 1 - Math.exp(-delta * 12)
    let animationInProgress = false

    interactiveObjects.forEach(({ interactionId, object, localCenter, basePosition, baseScale }) => {
      const targetScale = hoveredId === interactionId ? baseScale * 1.04 : baseScale
      const interpolatedScale = THREE.MathUtils.lerp(object.scale.x, targetScale, easing)
      const nextScale = Math.abs(interpolatedScale - targetScale) < SCALE_EPSILON ? targetScale : interpolatedScale
      const scaleRatio = nextScale / baseScale

      if (nextScale !== targetScale) animationInProgress = true

      object.scale.setScalar(nextScale)
      object.position.copy(basePosition).addScaledVector(localCenter, 1 - scaleRatio)
      object.updateMatrixWorld()
    })

    if (animationInProgress) invalidate()
  })

  const handleObjectClick = (event) => {
    const target = findInteractiveParent(event.object)
    if (!target || event.delta > 4) return

    event.stopPropagation()
    navigateToSection(target.userData.interactionId)
  }

  return (
    <>
      <primitive
        object={scene}
        onClick={handleObjectClick}
      />
      {interactiveObjects.map(({ interactionId, hitboxCenter, hitboxSize }) => (
        <InteractionHitbox
          key={`${interactionId}-hitbox`}
          interactionId={interactionId}
          center={hitboxCenter}
          size={hitboxSize}
          onHover={onHover}
        />
      ))}
      {hotspotAnchors.map(({ hotspot, anchor }) => (
        <HotspotIndicator
          key={hotspot.interactionId}
          anchor={anchor}
          hotspot={hotspot}
          isActive={hoveredId === hotspot.interactionId}
          onHover={onHover}
        />
      ))}
    </>
  )
}

function NightScene({ hoveredId, onHover }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#91868b', '#171416', 0.55]} />
      <directionalLight
        castShadow
        position={[8, 12, 10]}
        intensity={0.22}
        color="#c9b4bd"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={30}
        shadow-bias={-0.0001}
      />
      <group position={[0, -1.15, 0]}>
        <Suspense fallback={null}>
          <LoftModel
            hoveredId={hoveredId}
            onHover={onHover}
          />
        </Suspense>
        <ContactShadows
          position={[0, -0.18, 0]}
          opacity={0.35}
          scale={18}
          blur={2.5}
          far={7}
          frames={1}
          color="#0c090b"
        />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        minPolarAngle={0.65}
        maxPolarAngle={1.35}
        target={[0, 0.45, 0]}
      />
    </>
  )
}

export default function LoftScene() {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <Canvas
      className={`loft-canvas ${hoveredId ? 'is-hotspot-active' : ''}`}
      camera={{ position: BASE_CAMERA_POSITION.toArray(), fov: BASE_CAMERA_FOV, zoom: 1, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      shadows
      onPointerMissed={() => setHoveredId(null)}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
      }}
    >
      <ResponsiveCamera />
      <NightScene
        hoveredId={hoveredId}
        onHover={setHoveredId}
      />
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH)
