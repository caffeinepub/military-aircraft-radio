import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { RadioStation } from "../services/radioBrowserApi";
import { getCountryCoordinates } from "@/utils/geoMapping";

interface FullscreenGlobeProps {
  station: RadioStation;
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

interface GlobeSceneProps {
  stationLat: number;
  stationLng: number;
}

function GlobeScene({ stationLat, stationLng }: GlobeSceneProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const clockRef = useRef(new THREE.Clock());

  const earthTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
  }, []);

  const bumpTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load("//unpkg.com/three-globe/example/img/earth-topology.png");
  }, []);

  const markerPosition = useMemo(
    () => latLngToVec3(stationLat, stationLng, 1.02),
    [stationLat, stationLng]
  );

  useEffect(() => {
    const targetPos = latLngToVec3(stationLat, stationLng, 3.0);
    camera.position.copy(targetPos);
    camera.lookAt(0, 0, 0);
  }, [camera, stationLat, stationLng]);

  useFrame(() => {
    const t = clockRef.current.getElapsedTime();
    if (globeRef.current) globeRef.current.rotation.y += 0.0003;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += 0.0003;

    if (markerRef.current) {
      const scale = 1 + 0.6 * Math.sin(t * 3);
      markerRef.current.scale.setScalar(scale);
      (markerRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.7 + 0.3 * Math.sin(t * 3);
    }
    if (ringRef.current) {
      const progress = (Math.sin(t * 2) + 1) / 2;
      ringRef.current.scale.setScalar(1 + 1.5 * progress);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - progress);
    }
  });

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
      <mesh ref={atmosphereRef} scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={0x4499ff} transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>

      {/* Pulsing dot — yellow-white for contrast against blue marble */}
      <mesh ref={markerRef} position={markerPosition}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={0xffee55} transparent opacity={1} />
      </mesh>

      {/* Expanding ring */}
      <mesh ref={ringRef} position={markerPosition}>
        <ringGeometry args={[0.04, 0.065, 32]} />
        <meshBasicMaterial color={0xffee55} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color={0xffffff} />
      <directionalLight position={[-5, -2, -3]} intensity={0.4} color={0x8899cc} />
    </>
  );
}

export default function FullscreenGlobe({ station }: FullscreenGlobeProps) {
  const coords = useMemo(
    () => getCountryCoordinates(station.country) ?? { lat: 20, lng: 0 },
    [station.country]
  );

  return (
    <div className="absolute inset-0" style={{ background: "#000000" }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade />
        <GlobeScene stationLat={coords.lat} stationLng={coords.lng} />
      </Canvas>
    </div>
  );
}
