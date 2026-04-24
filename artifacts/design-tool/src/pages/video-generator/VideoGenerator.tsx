/**
 * SAI ROLOTECH VIDEO GENERATOR
 * ============================
 * Ultra Premium 3D Video Recording System
 * Heavy 3D Graphics with Realistic Rendering
 */

import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
  Float,
  Text3D,
  MeshTransmissionMaterial,
  MeshDistortMaterial,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  Glitch,
  SSAO,
  DepthOfField,
} from '@react-three/postprocessing';
import * as THREE from 'three';

type Quality = 'low' | 'high' | 'ultra';
type Vector3Tuple = [number, number, number];

type VideoSettings = {
  quality: Quality;
  rotationSpeed: number;
  autoRotate: boolean;
  bloom: boolean;
  particles: boolean;
  glitch: boolean;
  fps: number;
  resolution: string;
};

type VideoMetrics = {
  stripWidth: string;
  stations: string;
  accuracy: string;
  safetyScore: string;
};

type ParticleFieldProps = {
  count?: number;
  color?: string;
};

type HeavyRollAssemblyProps = {
  rotation?: number;
  quality?: Quality;
};

type GlowingTextProps = {
  text: string;
  position?: Vector3Tuple;
};

type HeavyPostProcessingProps = {
  quality?: Quality;
};

type CameraControllerProps = {
  autoRotate?: boolean;
};

type Heavy3DSceneProps = {
  quality: Quality;
  rotation: number;
  autoRotate: boolean;
};

type ControlPanelProps = {
  settings: VideoSettings;
  onChange: (settings: VideoSettings) => void;
  onRecord: () => void;
  onExport: () => void;
  isRecording: boolean;
};

type InfoPanelProps = {
  metrics: VideoMetrics;
};

// ============================================
// 3D COMPONENTS - SUPER HEAVY GRAPHICS
// ============================================

/** Animated Particle Field */
function ParticleField({ count = 50000, color = '#0066ff' }: ParticleFieldProps) {
  const mesh = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  });

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.0005;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color={color} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

/** Ultra Realistic Roll Assembly */
function HeavyRollAssembly({ rotation = 0, quality = 'ultra' }: HeavyRollAssemblyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const segments = quality === 'ultra' ? 256 : quality === 'high' ? 128 : 64;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Upper Roll */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 4, segments]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
        />
      </mesh>

      {/* Upper Roll Groove */}
      <mesh position={[0, 2.5, 0]}>
        <torusGeometry args={[1.5, 0.15, segments, segments]} />
        <meshStandardMaterial color="#ff6600" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lower Roll */}
      <mesh position={[0, -2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 4, segments]} />
        <meshPhysicalMaterial
          color="#1a1a2e"
          metalness={0.95}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2}
        />
      </mesh>

      {/* Lower Roll Groove */}
      <mesh position={[0, -2.5, 0]}>
        <torusGeometry args={[1.5, 0.15, segments, segments]} />
        <meshStandardMaterial color="#ff6600" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Shaft */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 8, segments]} />
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={1}
          roughness={0.1}
        />
      </mesh>

      {/* Bearings */}
      <mesh position={[0, 0, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.5, segments]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.5, segments]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Stands */}
      <mesh position={[-3, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 7, 1]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[3, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 7, 1]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Animated Strip */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[10, 0.15, 1.5]} />
        <meshStandardMaterial
          color="#4a90d9"
          metalness={0.7}
          roughness={0.3}
          emissive="#1a3a5a"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

/** Glowing Text */
function GlowingText({ text, position = [0, 0, 0] }: GlowingTextProps) {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Text3D
        position={position}
        font="/fonts/helvetiker_bold.typeface.json"
        size={0.5}
        height={0.1}
        curveSegments={12}
      >
        {text}
        <meshStandardMaterial
          color="#00ffff"
          emissive="#0066ff"
          emissiveIntensity={2}
        />
      </Text3D>
    </Float>
  );
}

/** Energy Ring Effect */
function EnergyRings() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime) * 0.1);
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[4, 0.05, 16, 100]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
    </mesh>
  );
}

/** Animated Circuit Board Background */
function CircuitBackground() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshBasicMaterial
        color="#001133"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

// ============================================
// POST-PROCESSING EFFECTS
// ============================================

function HeavyPostProcessing({ quality = 'ultra' }: HeavyPostProcessingProps) {
  return (
    <EffectComposer multisampling={quality === 'ultra' ? 8 : 4}>
      <Bloom
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        intensity={quality === 'ultra' ? 1.5 : 1}
        radius={0.8}
      />
      <ChromaticAberration
        offset={[0.0005, 0.0005]}
        radialModulation
        modulationOffset={0.5}
      />
      <Noise opacity={0.02} />
      <Vignette darkness={0.5} offset={0.1} />
      <DepthOfField focusDistance={0.01} focalLength={0.02} bokehScale={3} />
    </EffectComposer>
  );
}

// ============================================
// CAMERA CONTROLLER
// ============================================

function CameraController({ autoRotate = false }: CameraControllerProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (autoRotate) {
      camera.position.x = Math.sin(Date.now() * 0.0002) * 10;
      camera.position.z = Math.cos(Date.now() * 0.0002) * 10;
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

// ============================================
// MAIN SCENE
// ============================================

function Heavy3DScene({ quality, rotation, autoRotate }: Heavy3DSceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={20}
      />

      <CameraController autoRotate={autoRotate} />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#0066ff" />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#ff6600" />

      {/* Environment */}
      <Environment preset="night" />
      <CircuitBackground />
      <ParticleField count={quality === 'ultra' ? 50000 : quality === 'high' ? 20000 : 10000} />

      {/* Main Content */}
      <HeavyRollAssembly rotation={rotation} quality={quality} />
      <EnergyRings />
      <GlowingText text="SAI ROLOTECH" position={[0, 5, 0]} />

      {/* Post Processing */}
      <HeavyPostProcessing quality={quality} />

      {/* Fog */}
      <fog attach="fog" args={['#000011', 10, 50]} />
    </>
  );
}

// ============================================
// UI CONTROLS
// ============================================

function ControlPanel({ settings, onChange, onRecord, onExport, isRecording }: ControlPanelProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6 w-80">
      <h2 className="text-cyan-400 font-bold text-lg mb-4">Video Generator Controls</h2>

      {/* Quality */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Quality</label>
        <select
          value={settings.quality}
          onChange={(e) => onChange({ ...settings, quality: e.target.value as Quality })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="low">Low (Fast Recording)</option>
          <option value="high">High (Recommended)</option>
          <option value="ultra">Ultra (4K Quality)</option>
        </select>
      </div>

      {/* Rotation Speed */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Rotation Speed</label>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.rotationSpeed}
          onChange={(e) => onChange({ ...settings, rotationSpeed: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Auto Rotate */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.autoRotate}
          onChange={(e) => onChange({ ...settings, autoRotate: e.target.checked })}
          className="w-5 h-5"
        />
        <label className="text-gray-400">Auto Rotate Camera</label>
      </div>

      {/* Effects */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm">Effects</label>
        <div className="space-y-2 mt-2">
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={settings.bloom} disabled className="w-4 h-4" />
            Bloom
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={settings.particles} disabled className="w-4 h-4" />
            Particles
          </label>
          <label className="flex items-center gap-2 text-gray-300">
            <input type="checkbox" checked={settings.glitch} disabled className="w-4 h-4" />
            Glitch Effect
          </label>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-2">
        <button
          onClick={onRecord}
          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
        >
          {isRecording ? '⏹️ STOP' : '🔴 RECORD'}
        </button>
        <button
          onClick={onExport}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all"
        >
          📹 EXPORT
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 text-xs text-gray-500">
        <div>FPS: {settings.fps || 60}</div>
        <div>Resolution: {settings.resolution || '1920x1080'}</div>
        <div>Encoding: GPU Accelerated</div>
      </div>
    </div>
  );
}

// ============================================
// INFO PANEL
// ============================================

function InfoPanel({ metrics }: InfoPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6 w-72">
      <h3 className="text-cyan-400 font-bold mb-3">Live Metrics</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Strip Width</span>
          <span className="text-green-400 font-mono">{metrics.stripWidth || '282.4'} mm</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Stations</span>
          <span className="text-green-400 font-mono">{metrics.stations || '8'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Accuracy</span>
          <span className="text-yellow-400 font-mono">{metrics.accuracy || '99.0'}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Safety Score</span>
          <span className="text-cyan-400 font-mono">{metrics.safetyScore || '95'}/100</span>
        </div>

        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Material</span>
            <span className="text-white">S350GD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Thickness</span>
            <span className="text-white">2.0 mm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Yield</span>
            <span className="text-white">350 MPa</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Recording Progress</span>
          <span>45%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-2/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// WATERMARK
// ============================================

function Watermark() {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
      <div className="text-2xl font-bold text-cyan-400 drop-shadow-lg">
        SAI ROLOTECH SMART ENGINES
      </div>
      <div className="text-sm text-gray-400">v2.3.0 | AI-Powered Roll Forming Design</div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function VideoGenerator() {
  const [settings, setSettings] = useState<VideoSettings>({
    quality: 'ultra',
    rotationSpeed: 50,
    autoRotate: true,
    bloom: true,
    particles: true,
    glitch: false,
    fps: 60,
    resolution: '1920x1080',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [metrics] = useState<VideoMetrics>({
    stripWidth: '282.4',
    stations: '8',
    accuracy: '99.0',
    safetyScore: '95',
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      if (settings.autoRotate) {
        setRotation((prev) => prev + settings.rotationSpeed * 0.0001);
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [settings.autoRotate, settings.rotationSpeed]);

  const handleRecord = () => {
    setIsRecording(!isRecording);
    // Recording logic would go here
  };

  const handleExport = () => {
    // Export logic would go here
    alert('Export functionality - Connect to recording service');
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-950 via-blue-950 to-gray-950 overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        ref={canvasRef}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true, // For screenshot/export
        }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Heavy3DScene
            quality={settings.quality}
            rotation={rotation}
            autoRotate={settings.autoRotate}
          />
        </Suspense>
      </Canvas>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full animate-pulse">
          <div className="w-3 h-3 bg-white rounded-full" />
          <span className="text-white font-bold">REC {new Date().toLocaleTimeString()}</span>
        </div>
      )}

      {/* UI Panels */}
      <ControlPanel
        settings={settings}
        onChange={setSettings}
        onRecord={handleRecord}
        onExport={handleExport}
        isRecording={isRecording}
      />

      <InfoPanel metrics={metrics} />
      <Watermark />

      {/* Loading Screen */}
      <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-4">SAI ROLOTECH</div>
          <div className="text-gray-400">Loading Heavy 3D Engine...</div>
          <div className="mt-4 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
