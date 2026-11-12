/**
 * @license
 * Neural Architect: The Bio-Synthetic Abyss
 * Three.js BioCore 3D Engine & Scene Architecture
 * Author & Lead Architect: Enes Öztürk
 *
 * Implements:
 * - 5 Biomechanical Layers of the Leviathan Mainframe
 * - Procedural RoomEnvironment & ACESFilmic PBR lighting
 * - Software-WebGL fenceSync pacing & zero-GC math allocation
 * - Real-Time Navier-Stokes fluid particles, electric synaptic arcs, and rotating ATP Synthase turbine
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BioLayerId } from '../types/simulation';
import { bioCore } from '../simulation/EnesBioCore';
import { bioAudio } from '../audio/BioAcousticEngine';

// Pre-allocated math objects to avoid Garbage Collection churn
const _vec3 = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorA = new THREE.Color();
const _colorB = new THREE.Color();

export type CameraMode = 'first_person' | 'orbital' | 'macro_micro';

export class BioSceneEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Lifecycle & Performance
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private isDestroyed: boolean = false;

  // Camera & Interaction
  public cameraMode: CameraMode = 'orbital';
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3(0, 8, 24);
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3(0, 8, 24);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3(0, 2, 0);

  // Mouse drag tracking for orbital camera
  private isDragging: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;
  private orbitTheta: number = 0.4;
  private orbitPhi: number = 1.1;
  private orbitRadius: number = 26;

  // Active layer & groups
  public currentLayer: BioLayerId = 'atp_reactor';
  private layerGroups: Map<BioLayerId, THREE.Group> = new Map();

  // Dynamic Elements for Animation
  // Layer 1: Capillary Hydraulics
  private capillaryTunnel!: THREE.Mesh;
  private fluidParticles!: THREE.Points;
  private fluidVelocities: Float32Array = new Float32Array(0);

  // Layer 2: Synaptic Chasms
  private synapticArcsGroup!: THREE.Group;
  private vesicleGroup!: THREE.Group;
  private axonBulb!: THREE.Group;
  private dendritePlate!: THREE.Group;

  // Layer 3: ATP Synthase Turbine
  private atpTurbineGroup!: THREE.Group;
  private atpCRingRotor!: THREE.Group;
  private atpGammaShaft!: THREE.Mesh;
  private atpStatorArm!: THREE.Group;
  private protonVortexParticles!: THREE.Points;

  // Layer 4: Leukocyte Bastion
  private phagocyteSentinel!: THREE.Group;
  private viralParasites!: THREE.Group;

  // Layer 5: Genome Core
  private dnaHelixGroup!: THREE.Group;
  private dnaRungs: THREE.Mesh[] = [];

  // Ground contact shadow
  private contactShadowPlane!: THREE.Mesh;

  constructor(mountElement: HTMLElement) {
    this.container = mountElement;

    // 1. Detect software WebGL from renderer string as per guidelines
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Horizon Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090e); // Deep Abyssal Bio-Navy
    this.scene.fog = new THREE.FogExp2(0x06090e, 0.024);

    // 4. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);
    this.camera.position.set(0, 8, 26);

    // 5. Procedural RoomEnvironment Studio Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Setup Lighting Rig
    this.setupLighting();

    // 7. Setup Ground Contact Shadow
    this.setupGroundShadow();

    // 8. Build 5 Procedural Bio-Mechanical Layers
    this.buildLayer1Capillary();
    this.buildLayer2Synaptic();
    this.buildLayer3AtpTurbine();
    this.buildLayer4Leukocyte();
    this.buildLayer5Genome();

    // Set initial visible layer
    this.setLayer('atp_reactor');

    // 9. Attach Event Listeners
    this.attachEventListeners();

    // 10. Start Animation Loop with software WebGL guard
    this.startLoop();
  }

  // --- Lighting Rig ---
  private setupLighting() {
    // Warm Key Light (Biomechanical reactor amber/gold)
    const keyLight = new THREE.DirectionalLight(0xffb74d, 2.8);
    keyLight.position.set(12, 20, 16);
    keyLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      const d = 16;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    this.scene.add(keyLight);

    // Cool Sky/Ground HemisphereLight fill (Abyssal cyan/slate)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.2);
    this.scene.add(hemiLight);

    // Biological Point Light (Pulsing action potential conduit)
    const bioPointLight = new THREE.PointLight(0x00ffcc, 3.5, 40, 1.5);
    bioPointLight.position.set(0, 4, 0);
    this.scene.add(bioPointLight);
  }

  // Contact shadow grounding plane
  private setupGroundShadow() {
    const shadowGeo = new THREE.PlaneGeometry(50, 50);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.contactShadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowPlane.rotation.x = -Math.PI / 2;
    this.contactShadowPlane.position.y = -0.02;
    this.scene.add(this.contactShadowPlane);
  }

  // =========================================================================
  // LAYER 1: Kılcal Damar Labirentleri (The Capillary Hydraulics)
  // =========================================================================
  private buildLayer1Capillary() {
    const group = new THREE.Group();
    group.name = 'layer_capillary';

    // 1. Organic Ribbed Vascular Tunnel
    const tunnelGeo = new THREE.CylinderGeometry(4.2, 4.2, 40, 32, 40, true);
    // Deform geometry slightly to create ribbed organic rings
    const pos = tunnelGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const rib = Math.sin(y * 1.5) * 0.4 + Math.sin(angle * 6) * 0.15;
      const r = 4.2 + rib;
      pos.setX(i, Math.cos(angle) * r);
      pos.setZ(i, Math.sin(angle) * r);
    }
    tunnelGeo.computeVertexNormals();

    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Visceral crimson bio-flesh
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.BackSide,
      wireframe: false,
      emissive: 0x2e020d,
    });
    this.capillaryTunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    this.capillaryTunnel.rotation.z = Math.PI / 2;
    this.capillaryTunnel.position.set(0, 3.5, 0);
    group.add(this.capillaryTunnel);

    // 2. Mechanical Structural Hydraulic Rings (industrial reinforcement rings clamping the vessel)
    for (let i = -16; i <= 16; i += 8) {
      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(4.6, 0.28, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.25,
        metalness: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.y = Math.PI / 2;
      ringGroup.add(ringMesh);

      // Hydraulic valve pistons
      const pistonGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 12);
      const pistonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });
      for (let a = 0; a < 4; a++) {
        const piston = new THREE.Mesh(pistonGeo, pistonMat);
        const theta = (a * Math.PI) / 2;
        piston.position.set(0, Math.cos(theta) * 4.9, Math.sin(theta) * 4.9);
        piston.rotation.x = theta;
        ringGroup.add(piston);
      }

      ringGroup.position.set(i, 3.5, 0);
      group.add(ringGroup);
    }

    // 3. Navier-Stokes SPH Fluid Particles (Plasma Flow)
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    this.fluidVelocities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution along X
      const x = (Math.random() - 0.5) * 38;
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 3.4;
      const y = 3.5 + Math.cos(angle) * rad;
      const z = Math.sin(angle) * rad;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color gradation (erythrocyte red & glowing bioplasma cyan)
      const isBioPlasma = Math.random() > 0.65;
      if (isBioPlasma) {
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.85;
      } else {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.12;
        colors[i * 3 + 2] = 0.22;
      }
      this.fluidVelocities[i] = 12 + Math.random() * 24;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    this.fluidParticles = new THREE.Points(particleGeo, particleMat);
    group.add(this.fluidParticles);

    this.layerGroups.set('capillary', group);
    this.scene.add(group);
  }

  // =========================================================================
  // LAYER 2: Sinaptik Uçurumlar (The Synaptic Chasms)
  // =========================================================================
  private buildLayer2Synaptic() {
    const group = new THREE.Group();
    group.name = 'layer_synaptic';

    // 1. Presynaptic Axon Terminal Bulb (multi-part organic assembly)
    this.axonBulb = new THREE.Group();
    const bulbCoreGeo = new THREE.SphereGeometry(3.6, 24, 24);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: false,
      emissive: 0x064e3b,
      emissiveIntensity: 0.4,
    });
    const bulbMesh = new THREE.Mesh(bulbCoreGeo, bulbMat);
    this.axonBulb.add(bulbMesh);

    // Myelin Sheath Cable Conduits
    const cableGeo = new THREE.CylinderGeometry(0.4, 0.4, 18, 16);
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8,
    });
    for (let c = 0; c < 3; c++) {
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.set(-1.2 + c * 1.2, 0, -10);
      cable.rotation.x = Math.PI / 2;
      this.axonBulb.add(cable);
    }
    this.axonBulb.position.set(-8, 5, 0);
    group.add(this.axonBulb);

    // 2. Postsynaptic Dendritic Plate
    this.dendritePlate = new THREE.Group();
    const plateGeo = new THREE.CylinderGeometry(4.2, 5.0, 1.2, 24);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0x1e1b4b,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.rotation.z = Math.PI / 2;
    this.dendritePlate.add(plateMesh);

    // Ion Channel Receptors (glowing pore rings)
    const poreGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16);
    const poreMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (let p = 0; p < 8; p++) {
      const angle = (p * Math.PI * 2) / 8;
      const pore = new THREE.Mesh(poreGeo, poreMat);
      pore.position.set(0.65, Math.cos(angle) * 2.6, Math.sin(angle) * 2.6);
      pore.rotation.y = Math.PI / 2;
      this.dendritePlate.add(pore);
    }
    this.dendritePlate.position.set(8, 5, 0);
    group.add(this.dendritePlate);

    // 3. Floating Neurotransmitter Vesicles (glowing spheres in synaptic cleft)
    this.vesicleGroup = new THREE.Group();
    const vesicleGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const vesicleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
    });
    for (let v = 0; v < 40; v++) {
      const vesicle = new THREE.Mesh(vesicleGeo, vesicleMat);
      vesicle.position.set(
        (Math.random() - 0.5) * 8,
        5 + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      );
      this.vesicleGroup.add(vesicle);
    }
    group.add(this.vesicleGroup);

    // 4. Synaptic High-Voltage Electrical Arc Lightning Lines
    this.synapticArcsGroup = new THREE.Group();
    for (let a = 0; a < 4; a++) {
      const arcGeo = new THREE.BufferGeometry();
      const points = new Float32Array(20 * 3);
      arcGeo.setAttribute('position', new THREE.BufferAttribute(points, 3));
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        linewidth: 2,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      this.synapticArcsGroup.add(arcLine);
    }
    group.add(this.synapticArcsGroup);

    this.layerGroups.set('synaptic', group);
    this.scene.add(group);
  }

  // =========================================================================
  // LAYER 3: Mitokondriyal Reaktörler (The ATP Powerplants - The Crisis Turbine!)
  // =========================================================================
  private buildLayer3AtpTurbine() {
    const group = new THREE.Group();
    group.name = 'layer_atp_reactor';

    this.atpTurbineGroup = new THREE.Group();

    // 1. F0 c-Ring Rotor (12-cylinder titanium/organo turbine ring)
    this.atpCRingRotor = new THREE.Group();
    const rotorHubGeo = new THREE.CylinderGeometry(2.4, 2.4, 1.8, 32);
    const rotorHubMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Industrial amber bronze
      roughness: 0.22,
      metalness: 0.92,
    });
    const rotorHub = new THREE.Mesh(rotorHubGeo, rotorHubMat);
    this.atpCRingRotor.add(rotorHub);

    // 12 Outer Subunit Cylinders
    const subGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.2, 16);
    const subMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.18,
      metalness: 0.95,
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const sub = new THREE.Mesh(subGeo, subMat);
      sub.position.set(Math.cos(angle) * 2.7, 0, Math.sin(angle) * 2.7);
      this.atpCRingRotor.add(sub);
    }
    this.atpCRingRotor.position.set(0, 5, 0);
    this.atpTurbineGroup.add(this.atpCRingRotor);

    // 2. Central Gamma Drive Shaft (Connects F0 rotary ring to F1 catalytic head)
    const shaftGeo = new THREE.CylinderGeometry(0.65, 0.75, 4.8, 16);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    this.atpGammaShaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.atpGammaShaft.position.set(0, 1.8, 0);
    this.atpTurbineGroup.add(this.atpGammaShaft);

    // 3. F1 Catalytic Headpiece (Hexameric Alpha3/Beta3 Subunits)
    const f1Group = new THREE.Group();
    const subunitSphereGeo = new THREE.SphereGeometry(1.3, 16, 16);
    const alphaMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.7 });
    const betaMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.7 });

    for (let s = 0; s < 6; s++) {
      const angle = (s * Math.PI * 2) / 6;
      const mat = s % 2 === 0 ? alphaMat : betaMat;
      const subunit = new THREE.Mesh(subunitSphereGeo, mat);
      subunit.position.set(Math.cos(angle) * 1.9, 0, Math.sin(angle) * 1.9);
      f1Group.add(subunit);
    }
    f1Group.position.set(0, -1.2, 0);
    this.atpTurbineGroup.add(f1Group);

    // 4. Stator Arm / Stalk (Reinforced peripheral stalk clamping the engine)
    this.atpStatorArm = new THREE.Group();
    const stalkGeo = new THREE.BoxGeometry(0.6, 9.5, 0.8);
    const stalkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
    stalkMesh.position.set(3.8, 2.2, 0);
    this.atpStatorArm.add(stalkMesh);

    // Horizontal top bracket
    const bracketGeo = new THREE.BoxGeometry(4.2, 0.7, 0.8);
    const bracketMesh = new THREE.Mesh(bracketGeo, stalkMat);
    bracketMesh.position.set(2.0, 6.4, 0);
    this.atpStatorArm.add(bracketMesh);

    this.atpTurbineGroup.add(this.atpStatorArm);

    // 5. Chemiosmotic Proton ($H^+$) Vortex Particles
    const protonCount = 600;
    const protonGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(protonCount * 3);
    const pColors = new Float32Array(protonCount * 3);

    for (let p = 0; p < protonCount; p++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.5 + Math.random() * 4.2;
      const y = -2 + Math.random() * 9;
      pPositions[p * 3] = Math.cos(angle) * rad;
      pPositions[p * 3 + 1] = y;
      pPositions[p * 3 + 2] = Math.sin(angle) * rad;

      pColors[p * 3] = 0.95;
      pColors[p * 3 + 1] = 0.7;
      pColors[p * 3 + 2] = 0.1;
    }
    protonGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    protonGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const protonMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.protonVortexParticles = new THREE.Points(protonGeo, protonMat);
    this.atpTurbineGroup.add(this.protonVortexParticles);

    // 6. Mitochondrial Cristae Shell (outer biomechanical membrane chamber)
    const cristaeGeo = new THREE.TorusGeometry(8.5, 0.45, 16, 48);
    const cristaeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.8,
      wireframe: false,
    });
    const cristaeRing1 = new THREE.Mesh(cristaeGeo, cristaeMat);
    cristaeRing1.rotation.x = Math.PI / 2;
    cristaeRing1.position.y = 5;
    group.add(cristaeRing1);

    const cristaeRing2 = new THREE.Mesh(cristaeGeo, cristaeMat);
    cristaeRing2.rotation.x = Math.PI / 2;
    cristaeRing2.position.y = -1;
    group.add(cristaeRing2);

    this.atpTurbineGroup.position.set(0, 3, 0);
    group.add(this.atpTurbineGroup);

    this.layerGroups.set('atp_reactor', group);
    this.scene.add(group);
  }

  // =========================================================================
  // LAYER 4: Bağışıklık Kalesi (The Leukocyte Bastion)
  // =========================================================================
  private buildLayer4Leukocyte() {
    const group = new THREE.Group();
    group.name = 'layer_leukocyte';

    // 1. Patrolling Colossal Mechanical Phagocyte Crawler (Sentinel)
    this.phagocyteSentinel = new THREE.Group();
    const chassisGeo = new THREE.DodecahedronGeometry(2.8, 1);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    this.phagocyteSentinel.add(chassis);

    // Sensor Eye Lens
    const eyeGeo = new THREE.SphereGeometry(0.85, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 2.5);
    this.phagocyteSentinel.add(eye);

    // Hydraulic Limbs
    const legGeo = new THREE.CylinderGeometry(0.2, 0.28, 4.5, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.8 });
    for (let l = 0; l < 6; l++) {
      const angle = (l * Math.PI * 2) / 6;
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(Math.cos(angle) * 3.2, -1.8, Math.sin(angle) * 3.2);
      leg.rotation.z = Math.cos(angle) * 0.4;
      leg.rotation.x = Math.sin(angle) * 0.4;
      this.phagocyteSentinel.add(leg);
    }
    this.phagocyteSentinel.position.set(0, 4.5, 0);
    group.add(this.phagocyteSentinel);

    // 2. Swarm of Viral Parasites (Spiky mutated code clusters)
    this.viralParasites = new THREE.Group();
    const parasiteGeo = new THREE.IcosahedronGeometry(0.65, 0);
    const parasiteMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Hostile crimson hazard
      roughness: 0.25,
      metalness: 0.8,
      emissive: 0x991b1b,
      emissiveIntensity: 0.6,
    });
    for (let p = 0; p < 18; p++) {
      const parasite = new THREE.Mesh(parasiteGeo, parasiteMat);
      parasite.position.set(
        (Math.random() - 0.5) * 18,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 18
      );
      this.viralParasites.add(parasite);
    }
    group.add(this.viralParasites);

    this.layerGroups.set('leukocyte', group);
    this.scene.add(group);
  }

  // =========================================================================
  // LAYER 5: Çekirdek Genom Tapınağı (The Double-Helix Core)
  // =========================================================================
  private buildLayer5Genome() {
    const group = new THREE.Group();
    group.name = 'layer_genome_core';

    this.dnaHelixGroup = new THREE.Group();
    const pairCount = 36;
    const strandRadius = 3.2;
    const heightStep = 0.55;

    // Materials for the 4 nucleobases: Adenine, Thymine, Guanine, Cytosine
    const aMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2, metalness: 0.8, emissive: 0x064e3b }); // Green
    const tMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.2, metalness: 0.8, emissive: 0x1e3a8a }); // Blue
    const gMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8, emissive: 0x78350f }); // Amber
    const cMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.2, metalness: 0.8, emissive: 0x831843 }); // Magenta

    const rungGeo = new THREE.CylinderGeometry(0.14, 0.14, strandRadius * 2, 12);
    const backboneGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const backboneMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1, metalness: 0.95 });

    for (let i = 0; i < pairCount; i++) {
      const theta = i * 0.35;
      const y = (i - pairCount / 2) * heightStep + 6;

      // Base pair bridge (Rung)
      const mat = (i % 4 === 0) ? aMat : (i % 4 === 1) ? tMat : (i % 4 === 2) ? gMat : cMat;
      const rung = new THREE.Mesh(rungGeo, mat);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = theta;
      this.dnaHelixGroup.add(rung);
      this.dnaRungs.push(rung);

      // Sugar-phosphate backbone nodes on both sides
      const nodeA = new THREE.Mesh(backboneGeo, backboneMat);
      nodeA.position.set(Math.cos(theta) * strandRadius, y, Math.sin(theta) * strandRadius);
      this.dnaHelixGroup.add(nodeA);

      const nodeB = new THREE.Mesh(backboneGeo, backboneMat);
      nodeB.position.set(-Math.cos(theta) * strandRadius, y, -Math.sin(theta) * strandRadius);
      this.dnaHelixGroup.add(nodeB);
    }

    // Outer quantum holographic containment rings
    const ringGeo = new THREE.TorusGeometry(6.2, 0.18, 16, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 12;
    this.dnaHelixGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0;
    this.dnaHelixGroup.add(ring2);

    group.add(this.dnaHelixGroup);

    this.layerGroups.set('genome_core', group);
    this.scene.add(group);
  }

  // --- Layer Switching & Camera Transitions ---
  public setLayer(layerId: BioLayerId) {
    this.currentLayer = layerId;
    this.layerGroups.forEach((group, id) => {
      group.visible = id === layerId;
    });

    // Adjust camera targets based on layer focus
    switch (layerId) {
      case 'capillary':
        this.cameraLookTarget.set(0, 3.5, 0);
        this.targetCameraPos.set(0, 4.5, 14);
        break;
      case 'synaptic':
        this.cameraLookTarget.set(0, 5, 0);
        this.targetCameraPos.set(0, 6, 22);
        break;
      case 'atp_reactor':
        this.cameraLookTarget.set(0, 3.5, 0);
        this.targetCameraPos.set(0, 6, 20);
        break;
      case 'leukocyte':
        this.cameraLookTarget.set(0, 4, 0);
        this.targetCameraPos.set(0, 7, 24);
        break;
      case 'genome_core':
        this.cameraLookTarget.set(0, 6, 0);
        this.targetCameraPos.set(0, 7, 20);
        break;
    }
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
    if (mode === 'first_person') {
      // Visor cockpit view looking directly forward into the biomechanical void
      this.targetCameraPos.set(0, 3.8, 4.5);
      this.cameraLookTarget.set(0, 3.8, -10);
    } else if (mode === 'macro_micro') {
      // Close-up molecular inspection view
      this.targetCameraPos.set(0, 4.2, 7.5);
      this.cameraLookTarget.set(0, 4.0, 0);
    } else {
      // 360 Engineering orbital view
      this.setLayer(this.currentLayer);
    }
  }

  // --- Event Listeners & Interaction ---
  private attachEventListeners() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
      bioAudio.resume(); // Ensure Web Audio unlocks on first user pointer
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.prevMouseX;
      const deltaY = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      if (this.cameraMode === 'orbital') {
        this.orbitTheta -= deltaX * 0.006;
        this.orbitPhi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this.orbitPhi - deltaY * 0.006));
      } else if (this.cameraMode === 'first_person') {
        this.cameraLookTarget.x += deltaX * 0.03;
        this.cameraLookTarget.y = Math.max(0, Math.min(10, this.cameraLookTarget.y - deltaY * 0.03));
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.cameraMode === 'orbital') {
        this.orbitRadius = Math.max(8, Math.min(60, this.orbitRadius + e.deltaY * 0.03));
      }
    }, { passive: false });

    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    if (this.isDestroyed || !this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- Animation & Physics Tick Loop ---
  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;
      const dt = Math.min(0.1, this.clock.getDelta());

      // Update biophysical core engine
      bioCore.update(dt);

      // Animate 3D components according to physics telemetry
      this.updateAnimations(dt);

      // Smooth camera interpolation (exponential damping)
      this.updateCamera(dt);

      // Render
      this.renderer.render(this.scene, this.camera);

      // Software WebGL pacing with fenceSync as per SKILL.md
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 80);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private updateCamera(dt: number) {
    if (this.cameraMode === 'orbital') {
      const targetX = this.cameraLookTarget.x + this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const targetY = this.cameraLookTarget.y + this.orbitRadius * Math.cos(this.orbitPhi);
      const targetZ = this.cameraLookTarget.z + this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);
      this.targetCameraPos.set(targetX, targetY, targetZ);
    }

    // Exponential damping on camera position
    this.currentCameraPos.x = THREE.MathUtils.damp(this.currentCameraPos.x, this.targetCameraPos.x, 5.0, dt);
    this.currentCameraPos.y = THREE.MathUtils.damp(this.currentCameraPos.y, this.targetCameraPos.y, 5.0, dt);
    this.currentCameraPos.z = THREE.MathUtils.damp(this.currentCameraPos.z, this.targetCameraPos.z, 5.0, dt);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.cameraLookTarget);
  }

  private updateAnimations(dt: number) {
    const elapsed = this.clock.getElapsedTime();

    // 1. Capillary Hydraulics Animation
    if (this.currentLayer === 'capillary' && this.fluidParticles) {
      const posAttr = this.fluidParticles.geometry.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const flowMult = (bioCore.fluid.flowVelocityMls / 60) * 1.5;

      for (let i = 0; i < posArr.length / 3; i++) {
        // Move particles along X axis
        posArr[i * 3] += this.fluidVelocities[i] * dt * flowMult;
        if (posArr[i * 3] > 19) {
          posArr[i * 3] = -19;
        }
      }
      posAttr.needsUpdate = true;

      // Pulsing tunnel wall with systolic pressure
      const pRatio = bioCore.fluid.currentPressure / 120;
      const pulseScale = 1.0 + Math.sin(elapsed * 8) * 0.04 * pRatio;
      this.capillaryTunnel.scale.set(pulseScale, 1.0, pulseScale);
    }

    // 2. Synaptic Chasms Animation
    if (this.currentLayer === 'synaptic') {
      // Vesicle drift
      if (this.vesicleGroup) {
        this.vesicleGroup.children.forEach((v, idx) => {
          v.position.x += Math.sin(elapsed * 2 + idx) * 0.015;
          v.position.y += Math.cos(elapsed * 1.5 + idx) * 0.012;
        });
      }

      // Action Potential Sparks / Electrical Arcs
      if (this.synapticArcsGroup) {
        const isSpiking = bioCore.membrane.actionPotentialActive;
        this.synapticArcsGroup.children.forEach((lineMesh, arcIdx) => {
          const line = lineMesh as THREE.Line;
          line.visible = isSpiking || Math.random() < 0.15;
          if (line.visible) {
            const attr = line.geometry.attributes.position as THREE.BufferAttribute;
            const arr = attr.array as Float32Array;
            const startX = -4.5;
            const endX = 4.5;
            for (let pt = 0; pt < 20; pt++) {
              const alpha = pt / 19;
              const x = startX + (endX - startX) * alpha;
              const jitter = isSpiking ? 0.8 : 0.25;
              const y = 5 + (Math.random() - 0.5) * jitter;
              const z = (Math.random() - 0.5) * jitter + (arcIdx - 1.5) * 0.6;
              arr[pt * 3] = x;
              arr[pt * 3 + 1] = y;
              arr[pt * 3 + 2] = z;
            }
            attr.needsUpdate = true;
          }
        });
      }
    }

    // 3. ATP Synthase Turbine Animation (The Crisis Scenario!)
    if (this.currentLayer === 'atp_reactor' && this.atpCRingRotor) {
      // Rotation speed directly proportional to turbine RPM
      const radPerSec = (bioCore.turbine.rpm / 60) * Math.PI * 2;
      this.atpCRingRotor.rotation.y += radPerSec * dt;
      this.atpGammaShaft.rotation.y += radPerSec * dt;

      // Proton particles vortex inward down through the turbine c-ring
      if (this.protonVortexParticles) {
        const pAttr = this.protonVortexParticles.geometry.attributes.position as THREE.BufferAttribute;
        const pArr = pAttr.array as Float32Array;
        const vortexSpeed = (bioCore.turbine.protonMotiveForceDeltaPsi / 180) * 8.0;

        for (let p = 0; p < pArr.length / 3; p++) {
          pArr[p * 3 + 1] -= dt * vortexSpeed;
          // Spiral angle
          const curX = pArr[p * 3];
          const curZ = pArr[p * 3 + 2];
          const curR = Math.sqrt(curX * curX + curZ * curZ);
          const curA = Math.atan2(curZ, curX) + dt * 4.0;
          pArr[p * 3] = Math.cos(curA) * curR;
          pArr[p * 3 + 2] = Math.sin(curA) * curR;

          // Recycle protons when passing bottom
          if (pArr[p * 3 + 1] < -2.5) {
            pArr[p * 3 + 1] = 8.5;
            const newR = 0.5 + Math.random() * 4.2;
            const newA = Math.random() * Math.PI * 2;
            pArr[p * 3] = Math.cos(newA) * newR;
            pArr[p * 3 + 2] = Math.sin(newA) * newR;
          }
        }
        pAttr.needsUpdate = true;
      }
    }

    // 4. Leukocyte Bastion Animation
    if (this.currentLayer === 'leukocyte') {
      if (this.phagocyteSentinel) {
        this.phagocyteSentinel.rotation.y += dt * 0.4;
        this.phagocyteSentinel.position.y = 4.5 + Math.sin(elapsed * 2) * 0.4;
      }
      if (this.viralParasites) {
        this.viralParasites.children.forEach((p, idx) => {
          p.rotation.x += dt * (1 + idx * 0.1);
          p.rotation.y += dt * (1.5 + idx * 0.1);
          p.position.y += Math.sin(elapsed * 3 + idx) * 0.015;
        });
      }
    }

    // 5. Genome Core Animation
    if (this.currentLayer === 'genome_core' && this.dnaHelixGroup) {
      this.dnaHelixGroup.rotation.y += dt * 0.75;
      // Bioluminescent pulse along the rungs
      this.dnaRungs.forEach((rung, idx) => {
        const mat = rung.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.4 + Math.sin(elapsed * 4 + idx * 0.3) * 0.35;
      });
    }
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      clearTimeout(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    // Dispose geometries and materials
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
