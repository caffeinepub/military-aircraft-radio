import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Globe } from "lucide-react";
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

interface EarthSceneProps {
  stationPoints: StationPoint[];
  currentStation: RadioStation | null;
  onStationSelect: (station: RadioStation) => void;
  onHover: (station: RadioStation | null, pos: { x: number; y: number } | null) => void;
}

function EarthScene({ stationPoints, currentStation, onStationSelect, onHover }: EarthSceneProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const pointsGroupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const pointMeshes = useRef<Map<THREE.Mesh, StationPoint>>(new Map());
  const clockRef = useRef(new THREE.Clock());

  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
  }, []);

  const bumpTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-topology.png");
  }, []);

  useFrame(() => {
    const t = clockRef.current.getElapsedTime();
    if (globeRef.current) globeRef.current.rotation.y += 0.0008;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += 0.0008;
    if (pointsGroupRef.current) pointsGroupRef.current.rotation.y += 0.0008;

    pointMeshes.current.forEach((sp, mesh) => {
      const isCurrent = currentStation && sp.station.name === currentStation.name;
      if (isCurrent) {
        const scale = 1 + 0.5 * Math.sin(t * 4);
        mesh.scale.setScalar(scale);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * Math.sin(t * 4);
      }
    });
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
        color: isCurrent ? 0xffdd44 : 0xffffff,
        transparent: true,
        opacity: isCurrent ? 1.0 : 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(sp.position);
      pointsGroupRef.current!.add(mesh);
      pointMeshes.current.set(mesh, sp);
    });
  }, [stationPoints, currentStation]);

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
      {/* Bright blue atmosphere glow */}
      <mesh ref={atmosphereRef} scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={0x4488ff} transparent opacity={0.18} side={THREE.BackSide} />
      </mesh>
      <group ref={pointsGroupRef} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color={0xffffff} />
      <directionalLight position={[-5, -2, -3]} intensity={0.4} color={0x8899cc} />
    </>
  );
}

export default function GlobeView({ stations, onStationSelect, currentStation }: GlobeViewProps) {
  const [hoveredStation, setHoveredStation] = useState<RadioStation | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

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
    // Only add if we can map its country to coordinates
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
      .filter((p): p is StationPoint => p !== null);
  }, [mergedStations]);

  return (
    <div className="relative w-full h-full" style={{ background: "#000000" }}>
      {/* Top label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
        <Globe className="w-4 h-4 text-white/50" />
        <span className="text-xs text-white/50 tracking-widest uppercase">
          {stationPoints.length} stations mapped
        </span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
        <EarthScene
          stationPoints={stationPoints}
          currentStation={currentStation}
          onStationSelect={onStationSelect}
          onHover={handleHover}
        />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={5}
          rotateSpeed={0.4}
          zoomSpeed={0.6}
        />
      </Canvas>

      {/* Tooltip */}
      {hoveredStation && tooltipPos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
        >
          <div className="bg-background/90 border border-border rounded-md px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="text-sm font-medium text-foreground leading-tight">{hoveredStation.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hoveredStation.country}</p>
            {hoveredStation.tags && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 truncate max-w-[180px]">
                {hoveredStation.tags.split(",").slice(0, 2).join(", ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground/50 mt-1">Click to play</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {stationPoints.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center">
            <Globe className="w-10 h-10 text-white/30 mx-auto mb-3" />
            <p className="text-sm text-white/40">Search for stations to see them on the globe</p>
          </div>
        </div>
      )}
    </div>
  );
}
