import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import {
  DoubleSide,
  Float32BufferAttribute,
  BufferGeometry,
  type Mesh,
} from "three";
import { degToRad, type BuiltTrack, type PlacedPiece, type Vec2 } from "@slotforge/core";

interface Props {
  built: BuiltTrack;
}

type Vec3 = [number, number, number];

function edgePoint(
  piece: PlacedPiece,
  index: number,
  side: 1 | -1,
  halfWidth: number,
): Vec3 {
  const point = piece.points[index];
  const heading = piece.headings[index] ?? 0;
  if (!point) return [0, 0, 0];
  const normal = { x: -Math.sin(heading), y: Math.cos(heading) };
  const bank = degToRad(piece.spec.bank ?? 0);
  const direction = piece.spec.direction === "R" ? -1 : 1;
  const width = Math.cos(bank) * halfWidth;
  const height = -side * direction * Math.sin(bank) * halfWidth;
  return [
    point.x + normal.x * width * side,
    height,
    -(point.y + normal.y * width * side),
  ];
}

function surfaceGeometry(piece: PlacedPiece, halfWidth: number): BufferGeometry {
  const positions: number[] = [];
  for (let index = 0; index < piece.points.length - 1; index += 1) {
    const l0 = edgePoint(piece, index, 1, halfWidth);
    const r0 = edgePoint(piece, index, -1, halfWidth);
    const l1 = edgePoint(piece, index + 1, 1, halfWidth);
    const r1 = edgePoint(piece, index + 1, -1, halfWidth);
    positions.push(...l0, ...r0, ...l1);
    positions.push(...r0, ...r1, ...l1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function Track({ built }: { built: BuiltTrack }) {
  const geometries = useMemo(
    () =>
      built.placed.map((piece) => ({
        id: piece.placement.id,
        geometry: surfaceGeometry(piece, built.surfaceHalfWidth),
        bank: piece.spec.bank ?? 0,
      })),
    [built],
  );

  const laneLines = useMemo(() => {
    const lines: Vec3[][] = [];
    for (const piece of built.placed) {
      const bank = degToRad(piece.spec.bank ?? 0);
      const direction = piece.spec.direction === "R" ? -1 : 1;
      for (const lane of built.lanes) {
        const points = piece.points.map((point, index): Vec3 => {
          const heading = piece.headings[index] ?? 0;
          const normal = { x: -Math.sin(heading), y: Math.cos(heading) };
          const width = Math.cos(bank) * lane.offset;
          const height = -direction * Math.sin(bank) * lane.offset;
          return [
            point.x + normal.x * width,
            height + 0.05,
            -(point.y + normal.y * width),
          ];
        });
        if (points.length >= 2) lines.push(points);
      }
    }
    return lines;
  }, [built]);

  return (
    <group>
      {geometries.map((item) => (
        <mesh key={item.id} geometry={item.geometry} receiveShadow>
          <meshStandardMaterial
            color={item.bank ? "#38424f" : "#2a2f37"}
            roughness={0.85}
            metalness={0.08}
            side={DoubleSide}
          />
        </mesh>
      ))}
      {laneLines.map((points, index) => (
        <Line
          key={index}
          points={points}
          color="#9ca3af"
          lineWidth={1.2}
          transparent
          opacity={0.8}
        />
      ))}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.25, 2.2, built.surfaceHalfWidth * 2]} />
        <meshStandardMaterial color="#f87171" roughness={0.5} />
      </mesh>
    </group>
  );
}

function findAt(points: Vec2[], cumulative: number[], distance: number): Vec2 {
  const total = cumulative[cumulative.length - 1] ?? 0;
  let target = distance % total;
  if (target < 0) target += total;
  for (let index = 1; index < points.length; index += 1) {
    const start = cumulative[index - 1] ?? 0;
    const end = cumulative[index] ?? 0;
    if (target <= end) {
      const span = end - start || 1;
      const t = (target - start) / span;
      const a = points[index - 1]!;
      const b = points[index]!;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  return points[points.length - 1] ?? { x: 0, y: 0 };
}

function LapCam({
  points,
  active,
  speed,
}: {
  points: Vec2[];
  active: boolean;
  speed: number;
}) {
  const { camera } = useThree();
  const progress = useRef(0);

  const cumulative = useMemo(() => {
    const values = [0];
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1]!;
      const b = points[index]!;
      values.push((values[index - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
    }
    return values;
  }, [points]);

  useEffect(() => {
    progress.current = 0;
  }, [active]);

  useFrame((_, delta) => {
    if (!active || points.length < 2) return;
    const total = cumulative[cumulative.length - 1] ?? 0;
    if (total <= 0) return;
    progress.current = (progress.current + speed * delta) % total;
    const point = findAt(points, cumulative, progress.current);
    const ahead = findAt(points, cumulative, progress.current + 4);
    camera.position.set(point.x, 0.9, -point.y);
    camera.lookAt(ahead.x, 0.35, -ahead.y);
  });

  return null;
}

function CameraRig({
  centre,
  size,
  lapCam,
  resetKey,
}: {
  centre: { x: number; y: number };
  size: number;
  lapCam: boolean;
  resetKey: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (lapCam) return;
    camera.position.set(centre.x + size * 0.85, size * 0.75, -centre.y + size * 0.85);
    camera.lookAt(centre.x, 0, -centre.y);
  }, [camera, centre.x, centre.y, size, lapCam, resetKey]);

  return null;
}

export function Preview3D({ built }: Props) {
  const [lapCam, setLapCam] = useState(false);
  const [speed, setSpeed] = useState(28);
  const [resetKey, setResetKey] = useState(0);

  const centre = {
    x: (built.bounds.minX + built.bounds.maxX) / 2,
    y: (built.bounds.minY + built.bounds.maxY) / 2,
  };
  const size = Math.max(built.bounds.width, built.bounds.height, 30);
  const lane = built.lanes[0]?.points ?? [];

  return (
    <div className="preview3d">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: [centre.x + size, size, -centre.y + size],
          fov: 45,
          near: 0.1,
          far: 4000,
        }}
      >
        <color attach="background" args={["#0b0d11"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[size, size * 2, size]} intensity={1.6} castShadow />
        <directionalLight position={[-size, size, -size]} intensity={0.4} />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centre.x, -0.08, -centre.y]}
          receiveShadow
        >
          <planeGeometry args={[size * 3, size * 3]} />
          <meshStandardMaterial color="#11151b" roughness={1} />
        </mesh>

        <Track built={built} />

        <OrbitControls
          makeDefault
          enabled={!lapCam}
          target={[centre.x, 0, -centre.y]}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={4}
          maxDistance={size * 5}
        />
        <LapCam points={lane} active={lapCam} speed={speed} />
        <CameraRig centre={centre} size={size} lapCam={lapCam} resetKey={resetKey} />
      </Canvas>

      <div className="cam-controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={lapCam}
            onChange={(event) => setLapCam(event.target.checked)}
          />
          <span>Lap cam</span>
        </label>
        {lapCam && (
          <label className="speed">
            <span>{Math.round(speed)} in/s</span>
            <input
              type="range"
              min={8}
              max={80}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            />
          </label>
        )}
        <button onClick={() => setResetKey((key) => key + 1)}>Reset view</button>
        <span className="hint">Drag to orbit · scroll to zoom</span>
      </div>

      {built.placed.length === 0 && (
        <div className="canvas-empty">
          <strong>Nothing to preview</strong>
          <span>Add track pieces in the Design tab.</span>
        </div>
      )}
    </div>
  );
}
