import * as THREE from 'three';

export const CULTURAL_BIOMES = [
  {
    id: 'language',
    title: 'Èdè · Language',
    shortTitle: 'Language garden',
    description: 'Grow everyday words through greetings, listening, and short guided lessons.',
    phrase: 'Ẹ káàárọ̀',
    translation: 'Good morning',
    route: 'course',
    language: 'yoruba',
    color: 0x15764a,
    accent: 0x17864e,
    icon: 'È',
    position: [-3.7, 0, 1.3],
    chapter: 'Begin with a greeting',
    ageNote: 'Short, guided language practice',
  },
  {
    id: 'voice',
    title: 'Ohùn · Voice',
    shortTitle: 'Voice river',
    description: 'Listen closely, explore tone, and practise speaking at your own pace.',
    phrase: 'Listen · repeat · reflect',
    translation: null,
    route: 'trainer',
    color: 0x334139,
    accent: 0xe7f5fb,
    icon: '◖',
    position: [-1.9, 0, -1.5],
    chapter: 'Meet the sounds',
    ageNote: 'Audio activities for curious learners',
  },
  {
    id: 'stories',
    title: 'Ìtàn · Stories',
    shortTitle: 'Story grove',
    description: 'Read and listen to stories made to be shared across generations.',
    phrase: 'Stories travel with us',
    translation: null,
    route: 'ere',
    color: 0x15764a,
    accent: 0x17864e,
    icon: '✳',
    position: [0.4, 0, 1.2],
    chapter: 'Open a living story',
    ageNote: 'Read together and talk about the story',
  },
  {
    id: 'proverbs',
    title: 'Òwe · Wisdom',
    shortTitle: 'Wisdom well',
    description: 'Explore proverbs alongside their meaning, context, and community.',
    phrase: 'Words hold ways of seeing',
    translation: null,
    route: 'owe',
    color: 0x15764a,
    accent: 0xfff5d9,
    icon: '“',
    position: [2.4, 0, -1.4],
    chapter: 'Listen for the meaning',
    ageNote: 'A thoughtful cultural reading space',
  },
  {
    id: 'code',
    title: 'Kóòdù · Create',
    shortTitle: 'Maker ridge',
    description: 'Build ideas with creative coding and K–8 STEM activities.',
    phrase: 'Imagine · make · share',
    translation: null,
    route: 'coding',
    color: 0x15764a,
    accent: 0xeaf6ec,
    icon: '{ }',
    position: [4.1, 0, 1.25],
    chapter: 'Make your first pattern',
    ageNote: 'Project-based activities for young makers',
  },
];

const palette = {
  paper: 0xfffefa,
  land: 0xfaf9f2,
  indigo: 0x15764a,
  gold: 0xfff5d9,
  sage: 0xeaf6ec,
  clay: 0x15764a,
};

function supportsWebGL() {
  const canvas = document.createElement('canvas');
  return Boolean(window.WebGLRenderingContext
    && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
}

function mountFallback(container) {
  container.innerHTML = `
    <div class="world-fallback" role="img" aria-label="Illustrated Idilewa cultural world map">
      <span aria-hidden="true">✳</span>
      <p>The map is resting on this device. Choose a learning place below to explore.</p>
    </div>`;
  return { destroy() { container.replaceChildren(); } };
}

export function initCulturalWorld(container, onSelect) {
  if (!container) return null;
  if (!supportsWebGL()) return mountFallback(container);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'low-power',
    });
  } catch {
    return mountFallback(container);
  }

  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  const isPortrait = width / height < 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(49, width / height, 0.1, 80);
  camera.position.set(0, isPortrait ? 8.1 : 9.5, isPortrait ? 13 : 16.5);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.className = 'world-map-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.touchAction = 'none';
  container.replaceChildren(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe9e6f2, 0x7b715c, 2.05));
  const sun = new THREE.DirectionalLight(0xffe0a8, 3.1);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc8d3f1, 1.2);
  fill.position.set(7, 5, -6);
  scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);
  const sharedMaterials = {
    land: new THREE.MeshStandardMaterial({ color: palette.land, roughness: 0.96 }),
    path: new THREE.MeshStandardMaterial({ color: palette.gold, roughness: 0.8 }),
    foliage: new THREE.MeshStandardMaterial({ color: palette.sage, roughness: 0.92 }),
    darkFoliage: new THREE.MeshStandardMaterial({ color: palette.indigo, roughness: 0.9 }),
    clay: new THREE.MeshStandardMaterial({ color: palette.clay, roughness: 0.86 }),
    gold: new THREE.MeshStandardMaterial({ color: palette.gold, roughness: 0.6 }),
  };
  const land = new THREE.Mesh(new THREE.CircleGeometry(7.4, 32), sharedMaterials.land);
  land.rotation.x = -Math.PI / 2;
  land.position.y = -0.44;
  land.receiveShadow = true;
  world.add(land);

  const roadCurve = new THREE.CatmullRomCurve3(isPortrait
    ? [
      new THREE.Vector3(-3.7, -0.36, 1.8),
      new THREE.Vector3(-2.5, -0.34, 1.2),
      new THREE.Vector3(0.1, -0.35, 0.2),
      new THREE.Vector3(2.5, -0.34, 1),
      new THREE.Vector3(1.3, -0.33, -0.7),
      new THREE.Vector3(2.3, -0.34, -2),
      new THREE.Vector3(0, -0.35, -2.7),
      new THREE.Vector3(-2.4, -0.34, -2),
      new THREE.Vector3(-3.6, -0.36, -2.8),
    ]
    : [
      new THREE.Vector3(-5.1, -0.36, 1.1),
      new THREE.Vector3(-3.1, -0.34, 0.2),
      new THREE.Vector3(-1.2, -0.35, -0.25),
      new THREE.Vector3(0.5, -0.33, 0.05),
      new THREE.Vector3(2.2, -0.34, -0.2),
      new THREE.Vector3(4.9, -0.36, 0.9),
    ]);
  const road = new THREE.Mesh(
    new THREE.TubeGeometry(roadCurve, 48, 0.075, 5, false),
    sharedMaterials.path,
  );
  world.add(road);

  const pickables = [];
  const zoneByObject = new Map();
  const sharedIslandGeometry = new THREE.DodecahedronGeometry(1, 1);
  const treeGeometry = new THREE.ConeGeometry(0.22, 0.75, 5);
  const rockGeometry = new THREE.DodecahedronGeometry(0.33, 0);
  const decorativeTreeGeometry = new THREE.ConeGeometry(0.16, 0.52, 5);

  CULTURAL_BIOMES.forEach((biome, index) => {
    const island = new THREE.Group();
    const mapPosition = isPortrait
      ? [[-2.5, 0, 1.2], [2.5, 0, 1], [0, 0, -0.4], [2.35, 0, -2], [-2.35, 0, -2]][index]
      : biome.position;
    island.position.set(...mapPosition);
    world.add(island);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: biome.color,
      roughness: 0.88,
      flatShading: true,
    });
    const base = new THREE.Mesh(sharedIslandGeometry, baseMaterial);
    base.scale.set(isPortrait ? 1.25 : 1.05, 0.45, isPortrait ? 0.92 : 0.78);
    base.position.y = -0.02;
    base.castShadow = true;
    base.receiveShadow = true;
    island.add(base);
    pickables.push(base);
    zoneByObject.set(base, biome);

    const marker = new THREE.Mesh(
      new THREE.IcosahedronGeometry(isPortrait ? 0.48 : 0.42, 0),
      new THREE.MeshStandardMaterial({
        color: biome.accent,
        roughness: 0.52,
        flatShading: true,
        emissive: biome.accent,
        emissiveIntensity: 0.1,
      }),
    );
    marker.position.set(0, 0.48, 0);
    marker.castShadow = true;
    island.add(marker);
    pickables.push(marker);
    zoneByObject.set(marker, biome);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.025, 5, 32),
      new THREE.MeshStandardMaterial({ color: palette.gold, roughness: 0.55 }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.12;
    island.add(halo);

    for (let treeIndex = 0; treeIndex < 3; treeIndex += 1) {
      const angle = (treeIndex / 3) * Math.PI * 2 + index * 0.7;
      const tree = new THREE.Mesh(
        treeIndex === 1 ? treeGeometry : decorativeTreeGeometry,
        treeIndex === 1 ? sharedMaterials.foliage : sharedMaterials.darkFoliage,
      );
      tree.position.set(Math.cos(angle) * 0.84, 0.05, Math.sin(angle) * 0.65);
      tree.castShadow = true;
      island.add(tree);
    }

    const stone = new THREE.Mesh(rockGeometry, sharedMaterials.clay);
    stone.position.set(-0.55, 0.02, -0.48);
    stone.scale.set(1.25, 0.72, 0.85);
    stone.castShadow = true;
    island.add(stone);
  });

  const dayPhase = (new Date().getHours() + new Date().getMinutes() / 60) / 24;
  const daylight = Math.max(0, Math.sin((dayPhase - 0.25) * Math.PI * 2));
  sun.color.setHSL(0.1 + daylight * 0.025, 0.55, 0.67 + daylight * 0.08);
  scene.background = null;

  const cameraPath = new THREE.CatmullRomCurve3([
    ...(isPortrait
      ? [
        new THREE.Vector3(-0.4, 8.6, 13.8),
        new THREE.Vector3(-0.2, 8, 13),
        new THREE.Vector3(0.3, 7.7, 12.7),
        new THREE.Vector3(0.4, 8.2, 13.7),
      ]
      : [
        new THREE.Vector3(-2.6, 10.2, 17.6),
        new THREE.Vector3(-1.1, 9.4, 16.8),
        new THREE.Vector3(1.1, 8.8, 16.2),
        new THREE.Vector3(2.6, 9.4, 17.4),
      ]),
  ]);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const targetCamera = cameraPath.getPoint(0.35);
  const currentCamera = targetCamera.clone();
  const targetLook = new THREE.Vector3(0, 0, 0);
  const currentLook = targetLook.clone();
  let scrollProgress = 0.35;
  let panX = 0;
  let panZ = 0;
  let velocityX = 0;
  let velocityZ = 0;
  let pointerDown = null;
  let hovered = null;
  let animationFrame = 0;
  let disposed = false;

  function updateTargetCamera() {
    const pathPoint = cameraPath.getPoint(scrollProgress);
    targetCamera.set(
      THREE.MathUtils.clamp(pathPoint.x + panX, -5, 5),
      THREE.MathUtils.clamp(pathPoint.y + Math.abs(panX) * 0.06, isPortrait ? 6.6 : 7.4, 11.2),
      THREE.MathUtils.clamp(pathPoint.z + panZ, isPortrait ? 10.5 : 14.5, 19.5),
    );
    targetLook.set(THREE.MathUtils.clamp(panX * 0.35, -1.5, 1.5), 0, panZ * 0.3);
  }

  function raycast(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables, false)[0]?.object || null;
  }

  function onPointerDown(event) {
    pointerDown = { x: event.clientX, y: event.clientY, panX, panZ };
    renderer.domElement.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (pointerDown) {
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      panX = THREE.MathUtils.clamp(pointerDown.panX - dx * 0.008, -4.2, 4.2);
      panZ = THREE.MathUtils.clamp(pointerDown.panZ + dy * 0.006, -2.8, 2.8);
      velocityX = -dx * 0.000025;
      velocityZ = dy * 0.00002;
      updateTargetCamera();
      return;
    }
    const candidate = raycast(event);
    renderer.domElement.style.cursor = candidate ? 'pointer' : 'grab';
    if (candidate !== hovered) {
      if (hovered?.material?.emissive) hovered.material.emissiveIntensity = 0.1;
      hovered = candidate;
      if (hovered?.material?.emissive) hovered.material.emissiveIntensity = 0.32;
    }
  }

  function onPointerUp(event) {
    if (!pointerDown) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (moved > 9) return;
    const object = raycast(event);
    const biome = object && zoneByObject.get(object);
    if (biome) onSelect?.(biome.id);
  }

  function onWheel(event) {
    event.preventDefault();
    scrollProgress = THREE.MathUtils.clamp(scrollProgress + event.deltaY * 0.00035, 0, 1);
    updateTargetCamera();
  }

  function onResize() {
    const nextWidth = Math.max(1, container.clientWidth);
    const nextHeight = Math.max(1, container.clientHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
  resizeObserver?.observe(container);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = () => {
    if (disposed || reducedMotion) return;
    animationFrame = window.requestAnimationFrame(animate);
    panX = THREE.MathUtils.clamp(panX + velocityX, -4.2, 4.2);
    panZ = THREE.MathUtils.clamp(panZ + velocityZ, -2.8, 2.8);
    velocityX *= 0.9;
    velocityZ *= 0.9;
    updateTargetCamera();
    currentCamera.lerp(targetCamera, 0.075);
    currentLook.lerp(targetLook, 0.075);
    camera.position.copy(currentCamera);
    camera.lookAt(currentLook);
    world.rotation.y += 0.00035;
    renderer.render(scene, camera);
  };
  updateTargetCamera();
  currentCamera.copy(targetCamera);
  camera.lookAt(currentLook);
  renderer.render(scene, camera);
  if (!reducedMotion) animate();

  return {
    destroy() {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      resizeObserver?.disconnect();
      world.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      sharedIslandGeometry.dispose();
      treeGeometry.dispose();
      rockGeometry.dispose();
      decorativeTreeGeometry.dispose();
      renderer.dispose();
      container.replaceChildren();
    },
  };
}
