var FRAME_PRESETS = {
  upper: { heightFraction: 0.62, padding: 1.5 },
  full: { heightFraction: 1, padding: 1.3 }
};

export function mountAvatar(config) {
  var container = typeof config.container === 'string' ? document.getElementById(config.container) : config.container;
  if (!container) return;

  var mode = config.mode || 'cycle';
  var frame = config.frame || 'upper';
  var interactive = !!config.interactive;
  var autoRotate = config.autoRotate !== false && !!config.interactive;
  var preset = FRAME_PRESETS[frame] || FRAME_PRESETS.upper;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var captionEl = config.captionId ? document.getElementById(config.captionId) : null;
  var phrases = config.phrases || [];
  var poses = config.poses || {};
  var poseOrder = config.poseOrder || Object.keys(poses);
  var modelUrl = config.modelUrl || '/models/avatar.glb';
  var decoderPath = config.decoderPath || '/vendor/draco/1.5.7/';
  if (decoderPath.slice(-1) !== '/') decoderPath += '/';
  var renderer = null;
  var colorVars = config.colorVars || ['--sign', '--voice'];
  var width = config.width || 280;
  var height = config.height || 320;
  var captionIndex = 0;
  var interactHost = container.closest('.vx-scroll-avatar-stage') || container.closest('.vx-hero-avatar-wrap') || container;
  // A static image of the figure. It stays visible while the 3D model loads and
  // remains as the fallback when WebGL or the model is unavailable, so visitors
  // always see the human figure (never an empty box or a placeholder shape).
  var posterSrc = config.posterSrc || '/images/avatar/avatar-poster-480.webp';
  var posterSrcset = config.posterSrcset || '/images/avatar/avatar-poster-480.webp 480w, /images/avatar/avatar-poster-960.webp 960w';
  var posterAlt = config.posterAlt != null ? config.posterAlt : 'VoxSign signing avatar: a 3D human figure standing upright';

  function setState(state) {
    container.setAttribute('data-avatar-state', state);
    if (interactHost) interactHost.setAttribute('data-avatar-state', state);
  }

  function getPoster() {
    var img = container.querySelector('img.vx-avatar-poster');
    if (img) return img;
    img = document.createElement('img');
    img.className = 'vx-avatar-poster';
    img.src = posterSrc;
    img.srcset = posterSrcset;
    img.sizes = '(max-width: 900px) 70vw, 480px';
    img.width = 480;
    img.height = 680;
    img.alt = posterAlt;
    img.decoding = 'async';
    container.appendChild(img);
    return img;
  }

  function showLoading(percent) {
    var pct = typeof percent === 'number' ? Math.max(0, Math.min(100, Math.round(percent))) : null;
    var label = pct == null ? 'Loading figure…' : ('Loading figure… ' + pct + '%');
    var host = interactHost || container;
    var existing = host.querySelector('.vx-avatar-loading');
    if (!existing) {
      existing = document.createElement('div');
      existing.className = 'vx-avatar-loading' + (container.querySelector('img.vx-avatar-poster') ? ' vx-avatar-loading--poster' : '');
      existing.setAttribute('role', 'status');
      existing.setAttribute('aria-live', 'polite');
      existing.innerHTML =
        '<div class="vx-avatar-loading-silhouette" aria-hidden="true"></div>' +
        '<div class="vx-avatar-loading-meta">' +
          '<div class="vx-avatar-loading-bar" aria-hidden="true"><i></i></div>' +
          '<p class="vx-avatar-loading-text"></p>' +
        '</div>';
      host.appendChild(existing);
    }
    existing.hidden = false;
    var bar = existing.querySelector('.vx-avatar-loading-bar > i');
    var text = existing.querySelector('.vx-avatar-loading-text');
    if (bar) bar.style.width = (pct == null ? 12 : pct) + '%';
    if (text) text.textContent = label;
  }

  function hideLoading() {
    var host = interactHost || container;
    var existing = host.querySelector('.vx-avatar-loading');
    if (existing) existing.remove();
  }

  showLoading(0);

  function showFallback(reason) {
    hideLoading();
    setState('fallback:' + (reason || 'unknown'));
    if (typeof console !== 'undefined' && console.info) {
      console.info('VoxSign avatar: showing the still image (' + (reason || 'unknown') + ')');
    }
    if (renderer) {
      try {
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      } catch (e) {}
      renderer = null;
    }
    var canvases = container.querySelectorAll('canvas');
    for (var i = 0; i < canvases.length; i++) canvases[i].remove();
    var poster = getPoster();
    poster.hidden = false;
    container.classList.add('vx-avatar-fallback');
    if (captionEl && phrases.length) {
      captionEl.textContent = phrases[0];
      if (!reduceMotion) {
        setInterval(function () {
          captionIndex = (captionIndex + 1) % phrases.length;
          captionEl.textContent = phrases[captionIndex];
          container.classList.toggle('vx-phrase-2', captionIndex === 1);
        }, 3200);
      }
    }
  }

  function webglAvailable() {
    try {
      var canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }
  setState('loading');
  if (!webglAvailable()) { showFallback('no-webgl'); return; }

  Promise.all([
    import('three'),
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/loaders/DRACOLoader.js'),
    import('/js/vx-avatar-motion.js?v=8')
  ])
    .then(function (mods) {
      try {
        initScene(mods[0], mods[1].GLTFLoader, mods[2].DRACOLoader, mods[3]);
      } catch (err) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('VoxSign avatar: scene setup failed', err);
        }
        showFallback('scene-setup');
      }
    })
    .catch(function (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('VoxSign avatar: Three.js failed to load', err);
      }
      hideLoading();
      showFallback('modules');
    });

  function initScene(THREE, GLTFLoader, DRACOLoader, motionMod) {
    var w = container.clientWidth || width;
    var h = container.clientHeight || height;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      showFallback('renderer');
      return;
    }
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    if (THREE.ACESFilmicToneMapping != null) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.classList.add('vx-avatar-canvas');
    // The canvas stays transparent over the poster until the model has rendered.
    renderer.domElement.style.opacity = '0';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff0e6, 0x4a5a6e, 1.05));
    var key = new THREE.DirectionalLight(0xfff6ee, 1.35);
    key.position.set(2.4, 4.2, 2.8);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xa8c8ff, 0.45);
    fill.position.set(-3, 1.5, -1.2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xffffff, 0.4);
    rim.position.set(-0.5, 2.5, -3.5);
    scene.add(rim);

    function onProgress(event) {
      if (event && event.total) {
        showLoading((event.loaded / event.total) * 100);
      } else if (event && event.loaded) {
        showLoading(Math.min(92, 12 + (event.loaded / 650000) * 80));
      }
    }

    function loadGltf(useJsDecoder) {
      var dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(decoderPath);
      if (useJsDecoder) {
        dracoLoader.setDecoderConfig({ type: 'js' });
      }
      // No preload(): the decoder (wasm) is fetched only if the model is
      // Draco-compressed. avatar.glb is not, so nothing extra is downloaded.

      var loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.load(
        modelUrl,
        function (gltf) {
          hideLoading();
          onModelLoaded(gltf, THREE, scene, camera, renderer, motionMod);
          dracoLoader.dispose();
          revealCanvas();
        },
        onProgress,
        function (err) {
          dracoLoader.dispose();
          if (!useJsDecoder) {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn('VoxSign avatar: Draco wasm decode failed, retrying with JS decoder', err);
            }
            loadGltf(true);
            return;
          }
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('VoxSign avatar: model failed to decode', err);
          }
          showFallback('model');
        }
      );
    }

    loadGltf(false);

    window.addEventListener('resize', function () {
      if (!renderer) return;
      var nw = container.clientWidth || width;
      var nh = container.clientHeight || height;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  }

  function revealCanvas() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!renderer) return;
        renderer.domElement.style.transition = 'opacity .35s ease';
        renderer.domElement.style.opacity = '1';
        var poster = container.querySelector('img.vx-avatar-poster');
        if (poster) setTimeout(function () { poster.hidden = true; }, 400);
        container.classList.add('vx-avatar-ready');
        if (interactHost) interactHost.classList.add('is-3d');
        setState('ready');
      });
    });
  }

  function deg(THREE, x, y, z) {
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z)
    ));
  }

  function fitCameraToModel(THREE, root, camera) {
    var box = new THREE.Box3().setFromObject(root);
    var center = box.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= box.min.y;

    box.setFromObject(root);
    var size = box.getSize(new THREE.Vector3());
    center = box.getCenter(new THREE.Vector3());

    var targetHeight = size.y * preset.heightFraction;
    var fitCenterY = frame === 'full' ? center.y : box.max.y - targetHeight / 2;

    var vFov = camera.fov * (Math.PI / 180);
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    var distanceForHeight = (targetHeight / 2) / Math.tan(vFov / 2);
    var distanceForWidth = (size.x / 2) / Math.tan(hFov / 2);
    var distance = Math.max(distanceForHeight, distanceForWidth) * preset.padding;

    camera.position.set(center.x, fitCenterY, distance);
    camera.lookAt(center.x, fitCenterY, center.z);
    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 10;
    camera.updateProjectionMatrix();
  }

  function avatarKind(root) {
    var mixamo = false;
    var genesis = false;
    root.traverse(function (node) {
      var n = node.name || '';
      var matNode = node.material && (Array.isArray(node.material) ? node.material[0] : node.material);
    var m = (matNode && matNode.name) || '';
      var blob = n + ' ' + m;
      if (n.indexOf('mixamorig:') === 0 || n.indexOf('mixamorig') === 0 || /Alpha_(Body|Joints|Surface)/i.test(blob)) mixamo = true;
      if (/Genesis|Face-1|Body-1|Lips-1/i.test(blob)) genesis = true;
    });
    return mixamo ? 'mixamo' : (genesis ? 'genesis' : 'generic');
  }

  function makePhysicalSkin(THREE, hex, roughness, extras) {
    var Mat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
    var opts = Object.assign({
      color: new THREE.Color(hex),
      roughness: roughness,
      metalness: 0,
      flatShading: false
    }, extras || {});
    if (THREE.MeshPhysicalMaterial) {
      if (opts.sheen == null) opts.sheen = 0.7;
      if (opts.sheenRoughness == null) opts.sheenRoughness = 0.56;
      if (opts.sheenColor == null) opts.sheenColor = new THREE.Color(0xc47a52);
      if (opts.clearcoat == null) opts.clearcoat = 0.11;
      if (opts.clearcoatRoughness == null) opts.clearcoatRoughness = 0.46;
    }
    var mat = new Mat(opts);
    return mat;
  }

  function applyMixamoSkin(THREE, root) {
    // Warm medium-brown skin with a deeper joint tone so Mixamo spheres still read as joints.
    var body = makePhysicalSkin(THREE, 0xb88868, 0.52, {
      sheen: 0.62,
      sheenColor: new THREE.Color(0xc47a58),
      sheenRoughness: 0.6,
      clearcoat: 0.08,
      clearcoatRoughness: 0.5
    });
    body.name = 'Skin-Body';
    var joints = makePhysicalSkin(THREE, 0x7a4e35, 0.36, {
      sheen: 0.32,
      sheenColor: new THREE.Color(0xa86b4a),
      clearcoat: 0.32,
      clearcoatRoughness: 0.28
    });
    joints.name = 'Skin-Joints';
    root.traverse(function (node) {
      if (!node.isMesh || !node.material) return;
      var name = ((node.material.name || '') + ' ' + (node.name || ''));
      node.material = /Joint/i.test(name) ? joints : body;
      node.frustumCulled = true;
    });
  }

  function applyMixamoReadyPose(THREE, root) {
    var pose = {
      mixamorigLeftArm: [78, 6, 18],
      'mixamorig:LeftArm': [78, 6, 18],
      mixamorigRightArm: [78, -6, -18],
      'mixamorig:RightArm': [78, -6, -18],
      mixamorigLeftForeArm: [22, 0, 10],
      'mixamorig:LeftForeArm': [22, 0, 10],
      mixamorigRightForeArm: [22, 0, -10],
      'mixamorig:RightForeArm': [22, 0, -10]
    };
    var applied = {};
    function applyTo(bone) {
      if (!bone || !bone.name || !pose[bone.name] || applied[bone.name]) return;
      var e = pose[bone.name];
      bone.rotation.set(
        THREE.MathUtils.degToRad(e[0]),
        THREE.MathUtils.degToRad(e[1]),
        THREE.MathUtils.degToRad(e[2]),
        'XYZ'
      );
      applied[bone.name] = true;
    }
    root.traverse(function (node) {
      applyTo(node);
      if (node.isSkinnedMesh && node.skeleton && node.skeleton.bones) {
        node.skeleton.bones.forEach(applyTo);
      }
    });
    root.updateMatrixWorld(true);
    root.traverse(function (node) {
      if (node.isSkinnedMesh && node.skeleton && node.skeleton.update) node.skeleton.update();
    });
    return Object.keys(applied).length >= 2;
  }

  function syncMotionRest(motion) {
    if (!motion || !motion.bones || !motion.rest) return;
    Object.keys(motion.bones).forEach(function (key) {
      if (motion.bones[key] && motion.rest[key]) {
        motion.rest[key].copy(motion.bones[key].quaternion);
      }
    });
  }

  function applyRealisticSkin(THREE, root, renderer, scene, camera) {
    if (avatarKind(root) === 'mixamo') {
      applyMixamoSkin(THREE, root);
      return;
    }

    var texLoader = new THREE.TextureLoader();
    var pending = 0;
    var maps = {};

    function loadMap(key, url, isColor) {
      pending += 1;
      maps[key] = texLoader.load(url, function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4);
        if (isColor) {
          tex.repeat.set(1.15, 1.15);
          if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
          else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        } else {
          tex.repeat.set(4, 4);
        }
        tex.needsUpdate = true;
        pending -= 1;
        if (pending === 0) renderer.render(scene, camera);
      }, undefined, function () { pending -= 1; });
    }

    loadMap('body', '/models/textures/skin-body.png', true);
    loadMap('face', '/models/textures/skin-face.png', true);
    loadMap('lips', '/models/textures/skin-lips.png', true);
    loadMap('rough', '/models/textures/skin-roughness.png', false);

    function skinMat(mapKey, tintHex, roughness) {
      var Mat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
      var opts = {
        map: maps[mapKey],
        color: new THREE.Color(tintHex),
        roughness: roughness,
        metalness: 0,
        roughnessMap: maps.rough,
        flatShading: false
      };
      if (THREE.MeshPhysicalMaterial) {
        opts.sheen = 0.55;
        opts.sheenRoughness = 0.62;
        opts.sheenColor = new THREE.Color(0xb86a4a);
        opts.clearcoat = 0.08;
        opts.clearcoatRoughness = 0.5;
      }
      var mat = new Mat(opts);
      mat.name = 'Skin-' + mapKey;
      return mat;
    }

    function solidMat(hex, roughness, extras) {
      var Mat = THREE.MeshStandardMaterial;
      var opts = Object.assign({
        color: new THREE.Color(hex),
        roughness: roughness,
        metalness: 0
      }, extras || {});
      return new Mat(opts);
    }

    root.traverse(function (node) {
      if (!node.isMesh || !node.material) return;
      var mats = Array.isArray(node.material) ? node.material : [node.material];
      var next = mats.map(function (mat) {
        if (!mat) return solidMat(0xc99574, 0.55);
        var name = (mat.name || '') + ' ' + (node.name || '');

        if (/Lips/i.test(name)) return skinMat('lips', 0xc97878, 0.4);
        if (/Face|Head/i.test(name)) return skinMat('face', 0xd4a07a, 0.48);
        if (/Body|Arms|Legs|EyeSocket|Fingernail|Toenail/i.test(name)) return skinMat('body', 0xc99574, 0.55);
        if (/Cornea/i.test(name)) {
          return solidMat(0xffffff, 0.05, { transparent: true, opacity: 0.12, depthWrite: false });
        }
        if (/Pupil/i.test(name)) return solidMat(0x140e0c, 0.25);
        if (/Iris/i.test(name)) return solidMat(0x3a2418, 0.35);
        if (/Sclera/i.test(name)) return solidMat(0xf3efe8, 0.3);
        if (/Hair|Eyelash/i.test(name)) return solidMat(0x1c1612, 0.72);
        if (/Shirt/i.test(name)) return solidMat(0x2f6f86, 0.82);
        if (/Boxer/i.test(name)) return solidMat(0x1e2a36, 0.88);
        if (/Material\.002|Tear/i.test(name)) return solidMat(0xe8f4f8, 0.2, { transparent: true, opacity: 0.35 });
        // Unknown mesh parts: keep a warm skin default so nothing stays plastic white
        if (!mat.map) return skinMat('body', 0xc99574, 0.55);
        return mat;
      });
      node.material = Array.isArray(node.material) ? next : next[0];
      node.frustumCulled = true;
    });
  }

  function onModelLoaded(gltf, THREE, scene, camera, renderer, motionMod) {
    var root = gltf.scene;
    scene.add(root);
    try {
      applyMixamoReadyPose(THREE, root);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('VoxSign avatar: ready pose failed', e);
    }
    try {
      fitCameraToModel(THREE, root, camera);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('VoxSign avatar: camera fit failed', e);
    }
    try {
      applyRealisticSkin(THREE, root, renderer, scene, camera);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('VoxSign avatar: skin pass failed, using file materials', e);
    }

    var dragState = {
      active: false,
      yaw: root.rotation.y || 0,
      pitch: 0,
      yawVel: 0,
      userTurned: false
    };

    var motion = null;
    if (motionMod && motionMod.createAvatarMotion) {
      try {
        motion = motionMod.createAvatarMotion(THREE, root, {
          autoRotate: autoRotate && mode === 'idle' && !reduceMotion,
          mixamo: !!(root.getObjectByName('mixamorigHips') || root.getObjectByName('mixamorig:Hips'))
        });
        window.__VX_AVATAR_CTRL__ = motion;
      } catch (e) {
        if (typeof console !== 'undefined' && console.warn) console.warn('VoxSign avatar: motion controller failed', e);
      }
    }
    try {
      applyMixamoReadyPose(THREE, root);
      syncMotionRest(motion);
    } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('VoxSign avatar: ready pose failed', e);
    }
    var channel = window.__VX_AVATAR_MOTION__;
    if (channel) {
      channel.pose = 'idle';
      channel.nextPose = 'idle';
      channel.blend = 1;
    }
    if (interactive) {
      try { enableInteraction(renderer, root, dragState, interactHost); } catch (e) {}
    }

    if (mode === 'idle') {
      runIdle(THREE, renderer, scene, camera, root, dragState, motion);
    } else {
      runCycle(THREE, root, renderer, scene, camera, dragState, motion);
    }
  }

  function publishLook(x, y) {
    var m = window.__VX_AVATAR_MOTION__;
    if (!m) return;
    m.lookX = x;
    m.lookY = y;
  }

  function triggerWave() {
    var m = window.__VX_AVATAR_MOTION__;
    if (!m) return;
    m.gesture = 'wave';
    m.gestureStart = performance.now();
  }

  function enableInteraction(renderer, root, dragState, host) {
    var pending = false;
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    var startX = 0;
    var startY = 0;
    var moved = 0;
    var pointerId = null;
    var el = renderer.domElement;
    var surface = host || el;
    el.style.touchAction = 'pan-y';
    surface.style.cursor = 'grab';
    surface.style.touchAction = 'pan-y';
    if (!surface.hasAttribute('tabindex')) surface.setAttribute('tabindex', '0');

    function markInteracted() {
      if (host && host.classList) host.classList.add('has-interacted');
    }

    function lookFromEvent(e) {
      var rect = surface.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      var ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      publishLook(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny)));
    }

    function pointerDown(e) {
      if (e.button != null && e.button !== 0) return;
      pending = true;
      dragging = false;
      moved = 0;
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
    }
    function pointerMove(e) {
      if (!pending && !dragging) {
        lookFromEvent(e);
        return;
      }
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      if (pending && !dragging) {
        var totalX = e.clientX - startX;
        var totalY = e.clientY - startY;
        if (Math.abs(totalX) + Math.abs(totalY) < 16) return;
        if (Math.abs(totalY) > Math.abs(totalX) * 1.25) {
          pending = false;
          return;
        }
        dragging = true;
        dragState.active = true;
        dragState.yawVel = 0;
        surface.style.cursor = 'grabbing';
        if (host && host.classList) host.classList.add('is-dragging');
        try { surface.setPointerCapture(pointerId); } catch (err) {}
      }
      if (!dragging) return;
      lastX = e.clientX;
      lastY = e.clientY;
      dragState.yaw += dx * 0.01;
      dragState.pitch = Math.max(-0.38, Math.min(0.38, (dragState.pitch || 0) + dy * 0.004));
      dragState.yawVel = dx * 0.01;
      dragState.userTurned = true;
      root.rotation.y = dragState.yaw;
      root.rotation.x = dragState.pitch;
      moved += Math.abs(dx) + Math.abs(dy);
      markInteracted();
    }
    var ignoreClick = false;

    function pointerUp(e) {
      if (pending && !dragging) {
        triggerWave();
        markInteracted();
        lookFromEvent(e);
      }
      ignoreClick = true;
      pending = false;
      dragging = false;
      dragState.active = false;
      pointerId = null;
      surface.style.cursor = 'grab';
      if (host && host.classList) host.classList.remove('is-dragging');
    }
    function pointerLeave() {
      if (dragging || pending) return;
      publishLook(0, 0);
    }
    function onClick() {
      if (ignoreClick) {
        ignoreClick = false;
        return;
      }
      triggerWave();
      markInteracted();
    }

    function onKey(e) {
      if (e.key === 'ArrowLeft') {
        dragState.yaw += 0.14;
        dragState.userTurned = true;
        root.rotation.y = dragState.yaw;
        markInteracted();
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        dragState.yaw -= 0.14;
        dragState.userTurned = true;
        root.rotation.y = dragState.yaw;
        markInteracted();
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        triggerWave();
        markInteracted();
        e.preventDefault();
      }
    }

    surface.addEventListener('pointerdown', pointerDown);
    surface.addEventListener('pointermove', pointerMove);
    surface.addEventListener('pointerup', pointerUp);
    surface.addEventListener('pointercancel', pointerUp);
    surface.addEventListener('pointerleave', pointerLeave);
    surface.addEventListener('click', onClick);
    surface.addEventListener('keydown', onKey);
  }

  function applyRootSpin(root, dragState, nowMotion) {
    if (!dragState.active) {
      if (Math.abs(dragState.yawVel || 0) > 0.00018) {
        dragState.yaw += dragState.yawVel;
        dragState.yawVel *= 0.92;
      } else {
        dragState.yawVel = 0;
        if (autoRotate && !dragState.userTurned && !reduceMotion && !nowMotion) {
          dragState.yaw += 0.0022;
        }
      }
    }
    root.rotation.y = dragState.yaw;
    root.rotation.x = dragState.pitch || 0;
  }

  function runIdle(THREE, renderer, scene, camera, root, dragState, motion) {
    if (reduceMotion && !interactive) { renderer.render(scene, camera); return; }
    function tick(now) {
      applyRootSpin(root, dragState, !!motion);
      if (motion && !reduceMotion) {
        motion.tick(now, dragState);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function runCycle(THREE, root, renderer, scene, camera, dragState, motion) {
    if (!poseOrder.length) {
      runIdle(THREE, renderer, scene, camera, root, dragState, motion);
      return;
    }

    var boneNames = Object.keys(poses[poseOrder[0]] || {});
    var bones = {};
    boneNames.forEach(function (name) {
      var b = root.getObjectByName(name);
      if (b) bones[name] = b;
    });
    var restQuats = {};
    Object.keys(bones).forEach(function (name) { restQuats[name] = bones[name].quaternion.clone(); });

    var builtPoses = {};
    poseOrder.forEach(function (key) {
      var raw = poses[key] || {};
      var built = {};
      Object.keys(raw).forEach(function (boneName) {
        var t = raw[boneName];
        built[boneName] = deg(THREE, t[0], t[1], t[2]);
      });
      builtPoses[key] = built;
    });

    function applyPoseStatic(pose) {
      Object.keys(pose).forEach(function (name) { if (bones[name]) bones[name].quaternion.copy(pose[name]); });
    }

    if (reduceMotion) {
      applyPoseStatic(builtPoses[poseOrder[0]]);
      if (captionEl) captionEl.textContent = phrases[0];
      renderer.render(scene, camera);
      return;
    }

    var HOLD_MS = 3200;
    var TRANSITION_MS = 600;
    var poseIdx = 0;
    var phase = 'hold';
    var phaseStart = performance.now();

    function clonePose(boneMap) {
      var out = {};
      Object.keys(boneMap).forEach(function (name) { out[name] = boneMap[name].quaternion.clone(); });
      return out;
    }

    var fromPose = clonePose(bones);
    var toPose = builtPoses[poseOrder[0]];
    applyPoseStatic(toPose);
    if (captionEl) captionEl.textContent = phrases[0];

    function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function tick(now) {
      var elapsed = now - phaseStart;
      if (phase === 'hold' && elapsed >= HOLD_MS) {
        phase = 'transition';
        phaseStart = now;
        fromPose = clonePose(bones);
        poseIdx = (poseIdx + 1) % poseOrder.length;
        toPose = builtPoses[poseOrder[poseIdx]];
        if (captionEl) captionEl.textContent = phrases[poseIdx];
      } else if (phase === 'transition') {
        var t = Math.min(1, (now - phaseStart) / TRANSITION_MS);
        var e = easeInOutQuad(t);
        Object.keys(bones).forEach(function (name) {
          var target = toPose[name] || restQuats[name];
          if (target) bones[name].quaternion.slerpQuaternions(fromPose[name], target, e);
        });
        if (t >= 1) { phase = 'hold'; phaseStart = now; }
      }
      if (motion && phase === 'hold') {
        // Keep subtle breathing under scripted poses
        var m = window.__VX_AVATAR_MOTION__;
        if (m) { m.energy = 0.25; m.velocity = 0; }
      }
      if (autoRotate && !dragState.active && !dragState.userTurned) {
        dragState.yaw += 0.0015;
        root.rotation.y = dragState.yaw;
      } else {
        root.rotation.y = dragState.yaw;
        root.rotation.x = dragState.pitch || 0;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
}
