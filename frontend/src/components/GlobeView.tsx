import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { RadioStation } from "../services/radioBrowserApi";
import { getCountryCoordinates } from "@/utils/geoMapping";

interface GlobeViewProps {
  stations: RadioStation[];
  onStationSelect: (station: RadioStation) => void;
  currentStation: RadioStation | null;
}

interface StationPoint {
  station: RadioStation;
  position: THREE.Vector3;
}

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getIsLight(): boolean {
  return document.documentElement.classList.contains("light");
}

interface EarthSceneProps {
  stationPoints: StationPoint[];
  currentStation: RadioStation | null;
  onStationSelect: (station: RadioStation) => void;
  onHover: (station: RadioStation | null, pos: { x: number; y: number } | null) => void;
  isLight: boolean;
}

function EarthScene({ stationPoints, currentStation, onStationSelect, onHover, isLight }: EarthSceneProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointsGroupRef = useRef<THREE.Group>(null);
  const { camera, gl, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const pointMeshes = useRef<Map<THREE.Mesh, StationPoint>>(new Map());
  const clockRef = useRef(new THREE.Clock());
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirLight1Ref = useRef<THREE.DirectionalLight>(null);
  const dirLight2Ref = useRef<THREE.DirectionalLight>(null);

  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
  }, []);

  const bumpTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-topology.png");
  }, []);

  // Update scene background and lights when theme changes
  useEffect(() => {
    if (isLight) {
      scene.background = new THREE.Color(0xf0f4f8);
      gl.setClearColor(0xf0f4f8, 1);
    } else {
      scene.background = new THREE.Color(0x000000);
      gl.setClearColor(0x000000, 1);
    }
  }, [isLight, scene, gl]);

  // Update atmosphere when theme changes
  useEffect(() => {
    if (!atmosphereRef.current) return;
    const mat = atmosphereRef.current.material as THREE.MeshBasicMaterial;
    if (isLight) {
      mat.color.setHex(0x1a5fa8);
      mat.opacity = 0.28;
    } else {
      mat.color.setHex(0x4488ff);
      mat.opacity = 0.18;
    }
    mat.needsUpdate = true;
  }, [isLight]);

  // Update lights when theme changes
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = isLight ? 2.5 : 1.2;
    }
    if (dirLight1Ref.current) {
      dirLight1Ref.current.intensity = isLight ? 2.2 : 1.5;
      dirLight1Ref.current.color.setHex(isLight ? 0xfff8f0 : 0xffffff);
    }
    if (dirLight2Ref.current) {
      dirLight2Ref.current.intensity = isLight ? 0.8 : 0.4;
      dirLight2Ref.current.color.setHex(isLight ? 0xaabbdd : 0x8899cc);
    }
  }, [isLight]);

  useFrame(() => {
    if (globeRef.current) globeRef.current.rotation.y += 0.0008;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += 0.0008;
    if (pointsGroupRef.current) pointsGroupRef.current.rotation.y += 0.0008;
  });

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(pointMeshes.current.keys());
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const sp = pointMeshes.current.get(intersects[0].object as THREE.Mesh);
        if (sp) {
          onHover(sp.station, { x: event.clientX, y: event.clientY });
          gl.domElement.style.cursor = "pointer";
          return;
        }
      }
      onHover(null, null);
      gl.domElement.style.cursor = "default";
    },
    [camera, gl, mouse, raycaster, onHover]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(pointMeshes.current.keys());
      const intersects = raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const sp = pointMeshes.current.get(intersects[0].object as THREE.Mesh);
        if (sp) onStationSelect(sp.station);
      }
    },
    [camera, gl, mouse, raycaster, onStationSelect]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl, handleMouseMove, handleClick]);

  useEffect(() => {
    pointMeshes.current.clear();
    if (!pointsGroupRef.current) return;
    while (pointsGroupRef.current.children.length > 0) {
      pointsGroupRef.current.remove(pointsGroupRef.current.children[0]);
    }
    stationPoints.forEach((sp) => {
      const isCurrent = currentStation && sp.station.name === currentStation.name;
      const geo = new THREE.SphereGeometry(isCurrent ? 0.035 : 0.022, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: isLight ? 0x1a3a6e : 0xffffff,
        transparent: true,
        opacity: isCurrent ? 1.0 : 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(sp.position);
      pointsGroupRef.current!.add(mesh);
      pointMeshes.current.set(mesh, sp);
    });
  }, [stationPoints, currentStation, isLight]);

  // Suppress unused variable warning — clockRef kept for potential future use
  void clockRef.current;

  return (
    <>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={0.05}
          specular={new THREE.Color(0x224488)}
          shininess={15}
        />
      </mesh>
      {/* Atmosphere glow — color/opacity updated via ref when theme changes */}
      <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={isLight ? 0x1a5fa8 : 0x4488ff}
          transparent
          opacity={isLight ? 0.28 : 0.18}
          side={THREE.BackSide}
        />
      </mesh>
      <group ref={pointsGroupRef} />
      <ambientLight ref={ambientRef} intensity={isLight ? 2.5 : 1.2} />
      <directionalLight
        ref={dirLight1Ref}
        position={[5, 3, 5]}
        intensity={isLight ? 2.2 : 1.5}
        color={isLight ? 0xfff8f0 : 0xffffff}
      />
      <directionalLight
        ref={dirLight2Ref}
        position={[-5, -2, -3]}
        intensity={isLight ? 0.8 : 0.4}
        color={isLight ? 0xaabbdd : 0x8899cc}
      />
    </>
  );
}

export default function GlobeView({ stations, onStationSelect, currentStation }: GlobeViewProps) {
  const [hoveredStation, setHoveredStation] = useState<RadioStation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isLight, setIsLight] = useState<boolean>(getIsLight);

  // Observe theme class changes on document root
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(getIsLight());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleHover = useCallback(
    (station: RadioStation | null, pos: { x: number; y: number } | null) => {
      setHoveredStation(station);
      setTooltipPos(pos);
    },
    []
  );

  // Merge currentStation into the list if it's not already present and has a mappable country
  const mergedStations = useMemo<RadioStation[]>(() => {
    if (!currentStation) return stations;
    const alreadyPresent = stations.some((s) => s.name === currentStation.name);
    if (alreadyPresent) return stations;
    const coords = getCountryCoordinates(currentStation.country);
    if (!coords) return stations;
    return [currentStation, ...stations];
  }, [stations, currentStation]);

  // Stable deterministic jitter per station using index as seed
  const stationPoints = useMemo<StationPoint[]>(() => {
    return mergedStations
      .map((station, i) => {
        const coords = getCountryCoordinates(station.country);
        if (!coords) return null;
        const seed = i * 137.508;
        const jitterLat = coords.lat + ((seed % 5) - 2.5);
        const jitterLng = coords.lng + (((seed * 1.618) % 5) - 2.5);
        return {
          station,
          position: latLngToVec3(jitterLat, jitterLng, 1.01),
        };
      })
      .filter((sp): sp is StationPoint => sp !== null);
  }, [mergedStations]);

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Stars radius={100} depth={50} count={3000} factor={3} fade speed={0.5} />
        <EarthScene
          stationPoints={stationPoints}
          currentStation={currentStation}
          onStationSelect={onStationSelect}
          onHover={handleHover}
          isLight={isLight}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
        />
      </Canvas>

      {/* Hover tooltip — only shown on hover, positioned at cursor */}
      {hoveredStation && tooltipPos && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 36,
          }}
        >
          <div
            className="px-2 py-1 rounded text-xs font-medium shadow-lg"
            style={{
              backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.82)',
              color: isLight ? '#1a1a1a' : '#ffffff',
              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {hoveredStation.name}
            {hoveredStation.country && (
              <span style={{ opacity: 0.6 }}> · {hoveredStation.country}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
