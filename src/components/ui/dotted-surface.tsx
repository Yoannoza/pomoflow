"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

type DottedSurfaceProps = Omit<React.ComponentProps<"div">, "ref">;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const SEPARATION = 100;
    const AMOUNTX = 80;
    const AMOUNTY = 80;

    const isDark = resolvedTheme === "dark";

    const scene = new THREE.Scene();
    const fogColor = isDark ? new THREE.Color(0x0a1a15) : new THREE.Color(0xfaf6ef);
    scene.fog = new THREE.FogExp2(fogColor, 0.00025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      15000
    );
    camera.position.set(0, 500, 1800);
    camera.lookAt(0, 0, -500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(fogColor, 0);
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const numParticles = AMOUNTX * AMOUNTY;
    const positions = new Float32Array(numParticles * 3);
    const geometry = new THREE.BufferGeometry();
    geometryRef.current = geometry;

    let idx = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[idx] = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[idx + 1] = 0;
        positions[idx + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        idx += 3;
      }
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const dotColor = isDark
      ? new THREE.Color(0xc4b88f)
      : new THREE.Color(0x102c26);

    const material = new THREE.PointsMaterial({
      size: 6,
      color: dotColor,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
      fog: true,
    });
    materialRef.current = material;

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const posAttr = geometry.attributes.position;
      const arr = posAttr.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          arr[i * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 60 +
            Math.sin((iy + count) * 0.5) * 60;
          i++;
        }
      }

      posAttr.needsUpdate = true;
      count += 0.06;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      geometryRef.current = null;
      materialRef.current = null;
    };
  }, [resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 -z-10", className)}
      {...props}
    />
  );
}
