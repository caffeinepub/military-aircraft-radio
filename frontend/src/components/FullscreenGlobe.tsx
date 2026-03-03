import { useRef, useEffect, useMemo, useState } from "react";
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

function getIsLight(): boolean {
  return document.documentElement.classList.contains("light");
}

interface GlobeSceneProps {
  stationLat: number;
  stationLng: number;
  isLight: boolean;
}

function GlobeScene({ stationLat, stationLng, isLight }: GlobeSceneProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirLight1Ref = useRef<THREE.DirectionalLight>(null);
  const dirLight2Ref = useRef<THREE.DirectionalLight>(null);
  const { camera, gl, scene } = useThree();

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

  // Update scene background when theme changes
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
      mat.opacity = 0.32;
    } else {
      mat.color.setHex(0x4499ff);
      mat.opacity = 0.22;
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
    if (globeRef.current) globeRef.current.rotation.y += 0.0003;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += 0.0003;
  });

  const markerColor = isLight ? 0x1a3a6e : 0xffffff;

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
      <mesh ref={atmosphereRef} scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={isLight ? 0x1a5fa8 : 0x4499ff}
          transparent
          opacity={isLight ? 0.32 : 0.22}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Static station marker — no pulsing animation */}
      <mesh ref={markerRef} position={markerPosition}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.9} />
      </mesh>

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

export default function FullscreenGlobe({ station }: FullscreenGlobeProps) {
  const [isLight, setIsLight] = useState<boolean>(getIsLight);

  const coords = useMemo(
    () => getCountryCoordinates(station.country) ?? { lat: 20, lng: 0 },
    [station.country]
  );

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

  const bgColor = isLight ? "#f0f4f8" : "#000000";

  return (
    <div className="absolute inset-0" style={{ background: bgColor }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          const color = isLight ? 0xf0f4f8 : 0x000000;
          gl.setClearColor(color, 1);
          scene.background = new THREE.Color(color);
        }}
      >
        {!isLight && (
          <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade />
        )}
        <GlobeScene stationLat={coords.lat} stationLng={coords.lng} isLight={isLight} />
      </Canvas>
    </div>
  );
}
