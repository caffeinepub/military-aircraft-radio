import { useEffect, useRef } from "react";
import * as THREE from "three";

interface MiniGlobeProps {
  size?: number;
  amplitude?: number;
}

export function MiniGlobe({ size = 56, amplitude = 0 }: MiniGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const amplitudeRef = useRef(amplitude);

  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.5;

    const geo = new THREE.SphereGeometry(1, 48, 48);

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x0a1628),
      emissive: new THREE.Color(0x112244),
      emissiveIntensity: 0.4,
      shininess: 30,
      transparent: false,
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-dark.jpg",
      (texture) => {
        material.map = texture;
        material.color = new THREE.Color(0xffffff);
        material.emissive = new THREE.Color(0x112244);
        material.emissiveIntensity = 0.4;
        material.needsUpdate = true;
      },
      undefined,
      () => {
        // fallback: keep procedural dark globe
      },
    );

    const globe = new THREE.Mesh(geo, material);
    scene.add(globe);

    const atmGeo = new THREE.SphereGeometry(1.08, 32, 32);
    const atmMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0x4488ff),
      transparent: true,
      opacity: 0.3,
      side: THREE.FrontSide,
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    scene.add(atmosphere);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 2.0);
    sun.position.set(3, 2, 4);
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0xfff8f0, 0.8);
    fillLight.position.set(-3, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x2244aa, 0.5);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // Use a closure variable so the animation ID is always accessible
    // regardless of when sceneRef is populated
    let animId = 0;
    let frame = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      frame++;

      const amp = amplitudeRef.current;
      globe.rotation.y += 0.004 + amp * 0.012;
      globe.rotation.x = Math.sin(frame * 0.003) * 0.08;

      const scale = 1 + amp * 0.06;
      atmosphere.scale.setScalar(scale);
      (atmMat as THREE.MeshPhongMaterial).opacity = 0.3 + amp * 0.25;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: "block",
        borderRadius: "50%",
        border: "2px solid rgba(100, 160, 255, 0.55)",
      }}
    />
  );
}
