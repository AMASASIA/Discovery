import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { SpatialNodeData, GestureMode, SpatialMetrics } from '../types';
import { createNodeTexture } from './NodeTextureGenerator';
import { DISCOVERY_SECTORS } from '../data/spatialNodes';

interface SpatialSceneProps {
  nodes: SpatialNodeData[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
  gestureMode: GestureMode;
  onMetricsUpdate?: (metrics: SpatialMetrics) => void;
  onGestureActive?: (gesture: string) => void;
  targetPreset?: string | null;
  onPresetApplied?: () => void;
  activeTagFilter?: string | null;
  kuramotoR?: number;
}

export const SpatialScene: React.FC<SpatialSceneProps> = ({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  gestureMode,
  onMetricsUpdate,
  onGestureActive,
  targetPreset,
  onPresetApplied,
  activeTagFilter = null,
  kuramotoR = 0.65,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Keep live references to avoid stale closures in Three.js animation loop
  const selectedNodeIdRef = useRef(selectedNodeId);
  const hoveredNodeIdRef = useRef(hoveredNodeId);
  const gestureModeRef = useRef(gestureMode);
  const activeTagFilterRef = useRef(activeTagFilter);
  const kuramotoRRef = useRef(kuramotoR);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    hoveredNodeIdRef.current = hoveredNodeId;
  }, [hoveredNodeId]);

  useEffect(() => {
    gestureModeRef.current = gestureMode;
  }, [gestureMode]);

  useEffect(() => {
    activeTagFilterRef.current = activeTagFilter;
  }, [activeTagFilter]);

  useEffect(() => {
    kuramotoRRef.current = kuramotoR;
  }, [kuramotoR]);

  // Texture Cache to prevent recreation every frame
  const textureCacheRef = useRef<Map<string, THREE.CanvasTexture>>(new Map());

  // Node Mesh references map
  const nodeGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const interactivePlanesRef = useRef<THREE.Mesh[]>([]);

  // Camera State Controller ref
  const cameraControlRef = useRef({
    radius: 32,
    targetRadius: 32,
    theta: Math.PI * 0.25, // horizontal angle
    phi: Math.PI * 0.38,   // vertical angle (elevation)
    targetTheta: Math.PI * 0.25,
    targetPhi: Math.PI * 0.38,
    targetLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    velTheta: 0,
    velPhi: 0,
    isDragging: false,
    dragButton: 0,
    lastX: 0,
    lastY: 0,
    dragDistance: 0,
    panOffset: new THREE.Vector3(0, 0, 0),
    targetPanOffset: new THREE.Vector3(0, 0, 0),
    mouseScreenX: 0,
    mouseScreenY: 0,
    parallaxX: 0,
    parallaxY: 0,
  });

  // Handle Preset Views
  useEffect(() => {
    if (!targetPreset) return;
    const ctrl = cameraControlRef.current;

    if (targetPreset === 'overview') {
      ctrl.targetTheta = Math.PI * 0.25;
      ctrl.targetPhi = Math.PI * 0.38;
      ctrl.targetRadius = 34;
      ctrl.targetLookAt.set(0, 0, 0);
      ctrl.targetPanOffset.set(0, 0, 0);
    } else if (targetPreset === 'top') {
      ctrl.targetTheta = 0;
      ctrl.targetPhi = 0.08; // almost top-down
      ctrl.targetRadius = 38;
      ctrl.targetLookAt.set(0, 0, 0);
    } else if (targetPreset === 'cluster') {
      ctrl.targetTheta = Math.PI * 0.65;
      ctrl.targetPhi = Math.PI * 0.42;
      ctrl.targetRadius = 22;
      ctrl.targetLookAt.set(0, 1, 0);
    } else if (targetPreset === 'reset') {
      ctrl.targetTheta = Math.PI * 0.25;
      ctrl.targetPhi = Math.PI * 0.38;
      ctrl.targetRadius = 32;
      ctrl.targetLookAt.set(0, 0, 0);
      ctrl.targetPanOffset.set(0, 0, 0);
    }

    onPresetApplied?.();
  }, [targetPreset, onPresetApplied]);

  // When selectedNodeId changes, smoothly glide camera to focus on it
  useEffect(() => {
    if (!selectedNodeId) return;
    const targetNode = nodes.find(n => n.id === selectedNodeId);
    if (!targetNode) return;

    const ctrl = cameraControlRef.current;
    const [tx, ty, tz] = targetNode.position;
    
    // Set lookAt target to the node
    ctrl.targetLookAt.set(tx, ty, tz);
    // Move camera to a comfortable inspection distance
    ctrl.targetRadius = 14;
    // Calculate angle towards the node from origin with offset
    ctrl.targetTheta = Math.atan2(tx, tz) + 0.2;
    ctrl.targetPhi = Math.PI * 0.4;
  }, [selectedNodeId, nodes]);

  // Helper to get or create textures
  const getNodeTexture = useCallback((node: SpatialNodeData, isHov: boolean, isSel: boolean) => {
    const key = `${node.id}-${isHov ? 'h' : '0'}-${isSel ? 's' : '0'}`;
    let tex = textureCacheRef.current.get(key);
    if (!tex) {
      tex = createNodeTexture(node, isHov, isSel);
      textureCacheRef.current.set(key, tex);
    }
    return tex;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F2F2EF');
    scene.fog = new THREE.FogExp2('#F2F2EF', 0.014);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 12, 34);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x3B82F6, 1.5, 40);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 5. Spatial Reference Grid & Compass Platform (Floor at Y = -9)
    const floorGroup = new THREE.Group();
    floorGroup.position.y = -9;

    // Concentric coordinate rings
    const ringRadii = [8, 16, 24, 32];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.03, r, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: idx === ringRadii.length - 1 ? 0.06 : 0.03,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      floorGroup.add(ringMesh);
    });

    // 12 Radial Sector Axis Lines & Ground Markers (FR-03, FR-10)
    DISCOVERY_SECTORS.forEach((sec) => {
      const angle = sec.thetaBase;
      const points = [
        new THREE.Vector3(Math.cos(angle) * 3, 0, Math.sin(angle) * 3),
        new THREE.Vector3(Math.cos(angle) * 33, 0, Math.sin(angle) * 33),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.06,
      });
      floorGroup.add(new THREE.Line(lineGeo, lineMat));

      // Perimeter Sector Anchor Disc on ground
      const markerGeo = new THREE.CircleGeometry(0.6, 24);
      const markerMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(sec.accentColor),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.rotation.x = Math.PI / 2;
      markerMesh.position.set(Math.cos(angle) * 31, 0.02, Math.sin(angle) * 31);
      floorGroup.add(markerMesh);
    });

    // Dot Matrix ground
    const gridHelper = new THREE.GridHelper(64, 32, 0x000000, 0x000000);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.04;
    floorGroup.add(gridHelper);
    scene.add(floorGroup);

    // 6. Central Spatial Core Beacon (at 0, 0, 0)
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0);

    // Inner wireframe polyhedron
    const coreIcoGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const coreIcoMat = new THREE.MeshBasicMaterial({
      color: 0x1A1A19,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const coreIcoMesh = new THREE.Mesh(coreIcoGeo, coreIcoMat);
    coreGroup.add(coreIcoMesh);

    // Center pulsating nucleus
    const coreSphereGeo = new THREE.SphereGeometry(0.8, 24, 24);
    const coreSphereMat = new THREE.MeshStandardMaterial({
      color: 0x2D3748,
      roughness: 0.4,
      metalness: 0.6,
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    coreGroup.add(coreSphere);

    // Orbiting rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1A1A19,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    const coreRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.02, 16, 64), ringMat);
    const coreRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.02, 16, 64), ringMat);
    coreRing1.rotation.x = Math.PI / 3;
    coreRing2.rotation.y = Math.PI / 4;
    coreGroup.add(coreRing1);
    coreGroup.add(coreRing2);
    scene.add(coreGroup);

    // 7. Ambient Particle Field
    const particleCount = 900;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30 + 2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      particleScales[i] = Math.random() * 0.04 + 0.02;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x1A1A19,
      size: 0.06,
      transparent: true,
      opacity: 0.22,
    });
    const particleField = new THREE.Points(particleGeo, particleMat);
    scene.add(particleField);

    // 8. Create Floating Spatial UI Nodes
    const nodeGroups = new Map<string, THREE.Group>();
    const interactivePlanes: THREE.Mesh[] = [];

    nodes.forEach(node => {
      const group = new THREE.Group();
      group.position.set(node.position[0], node.position[1], node.position[2]);

      // Card Dimensions
      const cardW = 4.2;
      const cardH = 2.3;

      // Base texture
      const texture = getNodeTexture(node, false, false);
      const cardGeo = new THREE.PlaneGeometry(cardW, cardH);
      const cardMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.name = `node-card-${node.id}`;
      cardMesh.userData = { nodeId: node.id, type: 'card' };
      group.add(cardMesh);
      interactivePlanes.push(cardMesh);

      // Backing Glass Plate (Frosted Architectural Pane)
      const backingGeo = new THREE.BoxGeometry(cardW + 0.16, cardH + 0.16, 0.06);
      const backingMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.04,
      });
      const backingMesh = new THREE.Mesh(backingGeo, backingMat);
      backingMesh.position.z = -0.04;
      group.add(backingMesh);

      // Glowing Accent Border Line
      const edgesGeo = new THREE.EdgesGeometry(cardGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x1A1A19,
        transparent: true,
        opacity: 0.2,
      });
      const edgesLine = new THREE.LineSegments(edgesGeo, edgesMat);
      edgesLine.name = 'edges-line';
      group.add(edgesLine);

      // Ground Anchor Beacon Stem (thin line dropping to floor at Y = -9)
      const stemPoints = [
        new THREE.Vector3(0, -cardH / 2, 0),
        new THREE.Vector3(0, -9 - node.position[1], 0),
      ];
      const stemGeo = new THREE.BufferGeometry().setFromPoints(stemPoints);
      const stemMat = new THREE.LineDashedMaterial({
        color: 0x1A1A19,
        dashSize: 0.3,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.12,
      });
      const stemLine = new THREE.Line(stemGeo, stemMat);
      stemLine.computeLineDistances();
      group.add(stemLine);

      // Ground Projection Disc
      const groundDiscGeo = new THREE.RingGeometry(0.3, 0.5, 32);
      const groundDiscMat = new THREE.MeshBasicMaterial({
        color: 0x1A1A19,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const groundDisc = new THREE.Mesh(groundDiscGeo, groundDiscMat);
      groundDisc.rotation.x = Math.PI / 2;
      groundDisc.position.set(0, -9 - node.position[1], 0);
      group.add(groundDisc);

      // Floating Gyro Ring above node
      const topRingGeo = new THREE.TorusGeometry(0.5, 0.015, 8, 32);
      const topRingMat = new THREE.MeshBasicMaterial({
        color: 0x1A1A19,
        transparent: true,
        opacity: 0.25,
      });
      const topRing = new THREE.Mesh(topRingGeo, topRingMat);
      topRing.name = 'top-ring';
      topRing.position.set(0, cardH / 2 + 0.3, 0);
      topRing.rotation.x = Math.PI / 2;
      group.add(topRing);

      scene.add(group);
      nodeGroups.set(node.id, group);
    });

    nodeGroupsRef.current = nodeGroups;
    interactivePlanesRef.current = interactivePlanes;

    // 9. Inter-Node Constellation Lines
    const connectionLinesMap = new Map<string, THREE.Line>();
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (!targetNode) return;

        const lineKey = [node.id, targetId].sort().join('--');
        if (connectionLinesMap.has(lineKey)) return;

        const p1 = new THREE.Vector3(node.position[0], node.position[1], node.position[2]);
        const p2 = new THREE.Vector3(targetNode.position[0], targetNode.position[1], targetNode.position[2]);
        const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const mat = new THREE.LineBasicMaterial({
          color: 0x1A1A19,
          transparent: true,
          opacity: 0.08,
        });
        const line = new THREE.Line(geo, mat);
        line.userData = { from: node.id, to: targetId };
        scene.add(line);
        connectionLinesMap.set(lineKey, line);
      });
    });

    // 10. Raycaster for Mouse Gestures & Interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 11. Mouse Gesture Event Listeners
    const ctrl = cameraControlRef.current;

    const onMouseDown = (e: MouseEvent) => {
      // Check if left (0), right (2), or middle (1)
      ctrl.isDragging = true;
      ctrl.dragButton = e.button;
      ctrl.lastX = e.clientX;
      ctrl.lastY = e.clientY;
      ctrl.dragDistance = 0;

      const gestureName = e.button === 2 || e.shiftKey || gestureModeRef.current === 'PAN'
        ? 'PANNING 3D SPACE'
        : 'ORBITING VIEW';
      onGestureActive?.(gestureName);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const currentX = e.clientX;
      const currentY = e.clientY;

      // Normalized coordinates (-1 to 1) for raycaster
      mouse.x = ((currentX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((currentY - rect.top) / rect.height) * 2 + 1;

      // Parallax subtle camera offset when hovering
      ctrl.mouseScreenX = mouse.x;
      ctrl.mouseScreenY = mouse.y;

      if (ctrl.isDragging) {
        const deltaX = currentX - ctrl.lastX;
        const deltaY = currentY - ctrl.lastY;
        ctrl.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

        const isPan = ctrl.dragButton === 2 || e.shiftKey || gestureModeRef.current === 'PAN';

        if (isPan) {
          // Pan Gesture: Move target in camera's view plane
          const panSpeed = ctrl.radius * 0.0012;
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const up = new THREE.Vector3().crossVectors(right, forward).normalize();

          const panDelta = right.clone().multiplyScalar(-deltaX * panSpeed)
            .add(up.clone().multiplyScalar(deltaY * panSpeed));

          ctrl.targetLookAt.add(panDelta);
          onGestureActive?.('PANNING 3D SPACE');
        } else {
          // Orbit Gesture: Rotate azimuth (theta) and elevation (phi)
          const rotSpeed = 0.005;
          ctrl.targetTheta -= deltaX * rotSpeed;
          ctrl.targetPhi -= deltaY * rotSpeed;

          // Clamp elevation phi to avoid gimbal flip
          ctrl.targetPhi = Math.max(0.08, Math.min(Math.PI * 0.48, ctrl.targetPhi));
          onGestureActive?.('ORBITING VIEW');
        }

        ctrl.lastX = currentX;
        ctrl.lastY = currentY;
      } else {
        // Hover Raycasting
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactivePlanesRef.current);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const nodeId = hit.userData.nodeId;
          if (hoveredNodeIdRef.current !== nodeId) {
            onHoverNode(nodeId);
            onGestureActive?.(`HOVERING ${nodeId.toUpperCase()}`);
          }
          container.style.cursor = 'pointer';
        } else {
          if (hoveredNodeIdRef.current !== null) {
            onHoverNode(null);
            onGestureActive?.('IDLE NAVIGATION');
          }
          container.style.cursor = 'grab';
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      // If drag distance was very small (< 6px), treat as click gesture!
      if (ctrl.dragDistance < 6) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactivePlanesRef.current);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const clickedNodeId = hit.userData.nodeId;
          onSelectNode(selectedNodeIdRef.current === clickedNodeId ? null : clickedNodeId);
          onGestureActive?.(`FOCUSED ON [${clickedNodeId}]`);
        } else {
          // Clicking empty space deselects
          if (selectedNodeIdRef.current) {
            onSelectNode(null);
            onGestureActive?.('SELECTION CLEARED');
          }
        }
      }

      ctrl.isDragging = false;
      onGestureActive?.('IDLE NAVIGATION');
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Mouse Wheel Zoom Gesture (Dolly)
      const zoomFactor = e.deltaY * 0.03;
      ctrl.targetRadius = Math.max(6, Math.min(55, ctrl.targetRadius + zoomFactor));
      onGestureActive?.(`DOLLY ZOOM: ${ctrl.targetRadius.toFixed(1)}m`);
    };

    const onDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      // Double Click Gesture: Reset view to overview
      ctrl.targetTheta = Math.PI * 0.25;
      ctrl.targetPhi = Math.PI * 0.38;
      ctrl.targetRadius = 32;
      ctrl.targetLookAt.set(0, 0, 0);
      onSelectNode(null);
      onGestureActive?.('RESET TO OVERVIEW');
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent default browser context menu for seamless right-click panning
    };

    // Touch Support for mobile and touchpads
    let initialTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        ctrl.isDragging = true;
        ctrl.dragButton = 0;
        ctrl.lastX = e.touches[0].clientX;
        ctrl.lastY = e.touches[0].clientY;
        ctrl.dragDistance = 0;
        onGestureActive?.('TOUCH ORBIT');
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDist = Math.hypot(dx, dy);
        onGestureActive?.('PINCH ZOOM');
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && ctrl.isDragging) {
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - ctrl.lastX;
        const deltaY = currentY - ctrl.lastY;
        ctrl.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);

        const rotSpeed = 0.006;
        ctrl.targetTheta -= deltaX * rotSpeed;
        ctrl.targetPhi -= deltaY * rotSpeed;
        ctrl.targetPhi = Math.max(0.08, Math.min(Math.PI * 0.48, ctrl.targetPhi));

        ctrl.lastX = currentX;
        ctrl.lastY = currentY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = initialTouchDist - dist;
        ctrl.targetRadius = Math.max(6, Math.min(55, ctrl.targetRadius + diff * 0.05));
        initialTouchDist = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (ctrl.dragDistance < 8 && e.changedTouches.length === 1) {
        const rect = container.getBoundingClientRect();
        const touchX = e.changedTouches[0].clientX;
        const touchY = e.changedTouches[0].clientY;
        mouse.x = ((touchX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touchY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactivePlanesRef.current);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const clickedNodeId = hit.userData.nodeId;
          onSelectNode(selectedNodeIdRef.current === clickedNodeId ? null : clickedNodeId);
        } else {
          onSelectNode(null);
        }
      }
      ctrl.isDragging = false;
      onGestureActive?.('IDLE NAVIGATION');
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('dblclick', onDoubleClick);
    container.addEventListener('contextmenu', onContextMenu);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 12. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 13. Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) * 0.001;
      lastTime = now;
      frameCount++;

      if (now - lastFpsUpdate > 600) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        frameCount = 0;
        lastFpsUpdate = now;
        onMetricsUpdate?.({
          renderFps: Math.min(fps, 60),
          nodeCount: nodes.length,
          spatialEntropy: parseFloat((0.84 + Math.sin(now * 0.0005) * 0.08).toFixed(2)),
          activeLinks: connectionLinesMap.size,
          cameraDistance: parseFloat(ctrl.radius.toFixed(1)),
        });
      }

      // Smooth Camera Interpolation (Damping / Momentum)
      const lerpSpeed = 0.07;
      ctrl.theta += (ctrl.targetTheta - ctrl.theta) * lerpSpeed;
      ctrl.phi += (ctrl.targetPhi - ctrl.phi) * lerpSpeed;
      ctrl.radius += (ctrl.targetRadius - ctrl.radius) * lerpSpeed;
      ctrl.currentLookAt.lerp(ctrl.targetLookAt, lerpSpeed);

      // Parallax subtle tilt
      ctrl.parallaxX += (ctrl.mouseScreenX * 1.2 - ctrl.parallaxX) * 0.05;
      ctrl.parallaxY += (ctrl.mouseScreenY * 0.8 - ctrl.parallaxY) * 0.05;

      // Spherical coordinates -> Cartesian camera position
      const sinPhi = Math.sin(ctrl.phi);
      const cosPhi = Math.cos(ctrl.phi);
      const sinTheta = Math.sin(ctrl.theta);
      const cosTheta = Math.cos(ctrl.theta);

      camera.position.x = ctrl.currentLookAt.x + ctrl.radius * sinPhi * sinTheta + ctrl.parallaxX;
      camera.position.y = ctrl.currentLookAt.y + ctrl.radius * cosPhi + ctrl.parallaxY;
      camera.position.z = ctrl.currentLookAt.z + ctrl.radius * sinPhi * cosTheta;
      camera.lookAt(ctrl.currentLookAt);

      // Central Reactor Core Rotation
      coreGroup.rotation.y += 0.004;
      coreIcoMesh.rotation.x += 0.002;
      coreRing1.rotation.z += 0.006;
      coreRing2.rotation.x -= 0.005;

      // Slow Drift of Particle Field
      particleField.rotation.y += 0.0004;

      // Floating Node Motion and Billboarding with Kuramoto Synchrony (FR-24)
      const t = now * 0.001;
      const currentSelected = selectedNodeIdRef.current;
      const currentHovered = hoveredNodeIdRef.current;
      const activeTag = activeTagFilterRef.current;
      const curR = kuramotoRRef.current ?? 0.65;

      nodeGroups.forEach((group, nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        const isSel = currentSelected === nodeId;
        const isHov = currentHovered === nodeId;
        const matchesTag = activeTag ? node.tags.includes(activeTag) : true;

        // Kuramoto phase-driven organic bobbing in 3D
        // When R is high, all nodes lock into synchronous harmonic oscillation
        const phaseFreq = 1.4 * (1 - curR * 0.4);
        const bobAmplitude = 0.12 + 0.22 * (1 - curR);
        const bob = Math.sin(t * phaseFreq + (node.phi ?? 0)) * bobAmplitude;
        group.position.y = node.position[1] + bob;

        // Smoothly orient cards towards camera (Billboarding)
        group.lookAt(camera.position);

        // Hover / Select / Tag highlight scale transition
        let targetScale = isSel ? 1.2 : isHov ? 1.08 : 1.0;
        if (activeTag && matchesTag) {
          targetScale *= 1.12;
        } else if (activeTag && !matchesTag) {
          targetScale *= 0.9;
        }
        group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

        // Dynamic Texture update if state changed
        const cardMesh = group.getObjectByName(`node-card-${nodeId}`) as THREE.Mesh;
        if (cardMesh && cardMesh.material) {
          const mat = cardMesh.material as THREE.MeshBasicMaterial;
          const tex = getNodeTexture(node, isHov, isSel);
          if (mat.map !== tex) {
            mat.map = tex;
            mat.needsUpdate = true;
          }
          // Dim non-matching nodes when a semantic tag is selected
          mat.opacity = activeTag ? (matchesTag ? 1.0 : 0.28) : 1.0;
        }

        // Top Gyro ring spin
        const topRing = group.getObjectByName('top-ring') as THREE.Mesh;
        if (topRing) {
          topRing.rotation.z += isSel ? 0.04 : isHov ? 0.02 : 0.008;
          const ringMat = topRing.material as THREE.MeshBasicMaterial;
          ringMat.opacity = isSel ? 0.8 : isHov ? 0.5 : 0.2;
        }

        // Accent edges line opacity & color
        const edges = group.getObjectByName('edges-line') as THREE.LineSegments;
        if (edges) {
          const edgesMat = edges.material as THREE.LineBasicMaterial;
          if (activeTag && matchesTag) {
            edgesMat.color.setHex(0x10B981);
            edgesMat.opacity = 0.85;
          } else {
            edgesMat.color.setHex(0x1A1A19);
            edgesMat.opacity = isSel ? 0.8 : isHov ? 0.4 : 0.15;
          }
        }
      });

      // Update Constellation Lines Highlights
      connectionLinesMap.forEach((line) => {
        const { from, to } = line.userData;
        const nodeFrom = nodes.find(n => n.id === from);
        const nodeTo = nodes.find(n => n.id === to);
        const isRelated = from === currentSelected || to === currentSelected;
        const isHoverRelated = from === currentHovered || to === currentHovered;
        const isTagBridge = activeTag && nodeFrom?.tags.includes(activeTag) && nodeTo?.tags.includes(activeTag);

        const lineMat = line.material as THREE.LineBasicMaterial;
        if (isTagBridge) {
          lineMat.opacity = 0.85;
          lineMat.color.setHex(0x10B981); // Emerald connection for shared term
        } else if (isRelated) {
          lineMat.opacity = 0.5;
          lineMat.color.setHex(0x1A1A19);
        } else if (isHoverRelated) {
          lineMat.opacity = 0.3;
          lineMat.color.setHex(0x3B82F6);
        } else {
          lineMat.opacity = activeTag ? 0.02 : 0.07;
          lineMat.color.setHex(0x1A1A19);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('dblclick', onDoubleClick);
      container.removeEventListener('contextmenu', onContextMenu);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [nodes, getNodeTexture, onHoverNode, onSelectNode, onMetricsUpdate, onGestureActive]);

  return (
    <div 
      id="spatial-canvas-viewport" 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
    />
  );
};
