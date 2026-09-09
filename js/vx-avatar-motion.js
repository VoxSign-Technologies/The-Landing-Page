/**
 * Flexible skeletal motion for Genesis-style (or Mixamo) avatars.
 * Scroll guide writes window.__VX_AVATAR_MOTION__; this controller reads it each frame.
 *
 * Pose keys are logical aliases resolved against whatever bones exist in the GLB,
 * so swapping a better-skinned model later keeps working without rewriting call sites.
 */
var BONE_ALIASES = {
  hip: ['hip', 'hip(drv)', 'Hips', 'mixamorig:Hips', 'mixamorigHips'],
  abdomen: ['abdomenUpper', 'abdomenUpper(drv)', 'abdomenLower', 'spine', 'mixamorig:Spine', 'mixamorigSpine'],
  chest: ['chestUpper', 'chestUpper(drv)', 'chestLower', 'mixamorig:Spine1', 'mixamorigSpine1', 'mixamorig:Spine2', 'mixamorigSpine2'],
  neck: ['neckUpper', 'neckUpper(drv)', 'neckLower', 'mixamorig:Neck', 'mixamorigNeck'],
  head: ['head', 'head(drv)', 'mixamorig:Head', 'mixamorigHead'],
  lCollar: ['lCollar', 'lCollar(drv)', 'mixamorig:LeftShoulder', 'mixamorigLeftShoulder'],
  rCollar: ['rCollar', 'rCollar(drv)', 'mixamorig:RightShoulder', 'mixamorigRightShoulder'],
  lArm: ['lShldrBend', 'lShldrBend(drv)', 'mixamorig:LeftArm', 'mixamorigLeftArm'],
  rArm: ['rShldrBend', 'rShldrBend(drv)', 'mixamorig:RightArm', 'mixamorigRightArm'],
  lForearm: ['lForearmBend', 'lForearmTwist', 'mixamorig:LeftForeArm', 'mixamorigLeftForeArm'],
  rForearm: ['rForearmBend', 'rForearmTwist', 'mixamorig:RightForeArm', 'mixamorigRightForeArm'],
  lHand: ['lHand', 'mixamorig:LeftHand', 'mixamorigLeftHand'],
  rHand: ['rHand', 'mixamorig:RightHand', 'mixamorigRightHand'],
  lThigh: ['lThighBend', 'lThighTwist', 'mixamorig:LeftUpLeg', 'mixamorigLeftUpLeg'],
  rThigh: ['rThighBend', 'rThighTwist', 'mixamorig:RightUpLeg', 'mixamorigRightUpLeg']
};

/** Section poses: degrees relative to bind/rest. Kept modest so unskinned body meshes still look OK. */
var SECTION_POSES = {
  hero: {
    chest: [4, 6, 0],
    neck: [0, 8, 0],
    head: [0, 6, 0],
    rCollar: [-12, 8, 18],
    rForearm: [-20, 0, 8],
    rHand: [0, 0, -12],
    lCollar: [4, -4, -6]
  },
  pearledu: {
    chest: [2, -10, 0],
    neck: [0, -8, 0],
    head: [0, -6, 0],
    lCollar: [-16, -10, -22],
    lForearm: [-28, 0, -10],
    lHand: [0, 10, 8],
    rCollar: [6, 4, 8]
  },
  accessibility: {
    chest: [6, 4, 0],
    neck: [4, 0, 0],
    head: [6, 0, 0],
    rCollar: [-28, 0, 32],
    rForearm: [-55, 10, 0],
    rHand: [10, 0, -18],
    lCollar: [-10, 0, -14],
    lForearm: [-20, 0, 0]
  },
  preview: {
    chest: [8, 0, 0],
    neck: [0, 0, 0],
    head: [2, 0, 0],
    rCollar: [-18, 12, 24],
    rForearm: [-35, 0, 6],
    lCollar: [-18, -12, -24],
    lForearm: [-35, 0, -6]
  },
  'how-it-works': {
    chest: [3, 8, 0],
    neck: [0, 10, 0],
    head: [0, 8, 0],
    rCollar: [-22, 5, 20],
    rForearm: [-40, 15, 0],
    rHand: [0, -8, -10],
    lCollar: [2, -2, -4]
  },
  team: {
    chest: [5, -4, 0],
    neck: [0, -4, 0],
    head: [0, -4, 0],
    rCollar: [-30, 0, 40],
    rForearm: [-10, 0, 10],
    rHand: [0, 0, -20],
    lCollar: [-8, 0, -10]
  },
  contact: {
    chest: [4, 0, 0],
    neck: [6, 0, 0],
    head: [8, 0, 0],
    rCollar: [-14, 0, 16],
    rForearm: [-25, 0, 0],
    rHand: [0, 0, 8],
    lCollar: [-14, 0, -16],
    lForearm: [-25, 0, 0]
  },
  idle: {
    chest: [2, 0, 0],
    neck: [0, 0, 0],
    head: [0, 0, 0],
    rCollar: [0, 0, 4],
    lCollar: [0, 0, -4],
    rArm: [0, 0, 2],
    lArm: [0, 0, -2]
  }
};

function resolveBones(root) {
  var out = {};
  Object.keys(BONE_ALIASES).forEach(function (key) {
    var names = BONE_ALIASES[key];
    for (var i = 0; i < names.length; i++) {
      var b = root.getObjectByName(names[i]);
      if (b) { out[key] = b; break; }
    }
  });
  return out;
}

function degEuler(THREE, x, y, z) {
  return new THREE.Euler(
    THREE.MathUtils.degToRad(x || 0),
    THREE.MathUtils.degToRad(y || 0),
    THREE.MathUtils.degToRad(z || 0),
    'XYZ'
  );
}

function lerpPose(a, b, t) {
  var out = {};
  var keys = {};
  Object.keys(a || {}).forEach(function (k) { keys[k] = 1; });
  Object.keys(b || {}).forEach(function (k) { keys[k] = 1; });
  Object.keys(keys).forEach(function (k) {
    var A = a[k] || [0, 0, 0];
    var B = b[k] || [0, 0, 0];
    out[k] = [
      A[0] + (B[0] - A[0]) * t,
      A[1] + (B[1] - A[1]) * t,
      A[2] + (B[2] - A[2]) * t
    ];
  });
  return out;
}

export function createAvatarMotion(THREE, root, options) {
  options = options || {};
  var bones = resolveBones(root);
  var rest = {};
  Object.keys(bones).forEach(function (k) {
    rest[k] = bones[k].quaternion.clone();
  });
  var baseY = root.position.y;
  var current = Object.assign({}, SECTION_POSES.idle);
  var tmpQ = new THREE.Quaternion();
  var tmpE = new THREE.Euler();

  // Public channel — scroll guide / page scripts can write here anytime
  if (!window.__VX_AVATAR_MOTION__) {
    window.__VX_AVATAR_MOTION__ = {
      pose: 'hero',
      nextPose: 'hero',
      blend: 1,
      velocity: 0,
      side: 1,
      energy: 0.35,
      lookX: 0,
      lookY: 0,
      gesture: null,
      gestureStart: 0
    };
  }

  function readMotion() {
    return window.__VX_AVATAR_MOTION__ || { pose: 'idle', blend: 1, velocity: 0, side: 1, energy: 0.3 };
  }

  function targetPoseFromMotion(m) {
    var a = SECTION_POSES[m.pose] || SECTION_POSES.idle;
    var b = SECTION_POSES[m.nextPose || m.pose] || a;
    return lerpPose(a, b, typeof m.blend === 'number' ? m.blend : 1);
  }

  function gestureOffsets(m, now) {
    var extra = {};
    if (m.gesture !== 'wave' || !m.gestureStart) return extra;
    var t = (now - m.gestureStart) / 1000;
    if (t >= 2) {
      m.gesture = null;
      m.gestureStart = 0;
      return extra;
    }
    var attack = Math.min(1, t / 0.22);
    var release = t > 1.55 ? Math.max(0, (2 - t) / 0.45) : 1;
    var w = attack * release;
    var flap = Math.sin(t * 14) * w;
    extra.rArm = [-62 * w, 28 * w, 48 * w];
    extra.rCollar = [-18 * w, 12 * w, 22 * w];
    extra.rForearm = [-42 * w, 18 * flap, 28 * flap];
    extra.rHand = [12 * flap, 20 * flap, -16 * w];
    extra.head = [0, 8 * w, 0];
    extra.chest = [0, 4 * w, 0];
    return extra;
  }

  function applyBoneOffsets(poseOffsets, breath, swing, lookX, lookY, extra, keyList) {
    var keys = keyList || Object.keys(bones);
    keys.forEach(function (key) {
      var bone = bones[key];
      if (!bone || !rest[key]) return;
      var o = poseOffsets[key] || [0, 0, 0];
      var e = (extra && extra[key]) || [0, 0, 0];
      var x = o[0] + e[0];
      var y = o[1] + e[1];
      var z = o[2] + e[2];

      if (key === 'chest' || key === 'abdomen') {
        x += breath * (key === 'chest' ? 2.2 : 1.4);
      }
      if (key === 'rCollar' || key === 'rArm') {
        z += swing * (key === 'rArm' ? 0.6 : 1);
        x += swing * 0.35;
      }
      if (key === 'lCollar' || key === 'lArm') {
        z -= swing * (key === 'lArm' ? 0.6 : 1);
        x += swing * 0.35;
      }
      if (key === 'rForearm') x += swing * 0.8;
      if (key === 'lForearm') x += swing * 0.8;
      if (key === 'head') {
        x += lookY * 14;
        y += lookX * 22 + Math.sin(breath * 0.7) * 1.2;
      }
      if (key === 'neck') {
        x += lookY * 7;
        y += lookX * 12 + Math.sin(breath * 0.7) * 0.6;
      }

      tmpE.set(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z),
        'XYZ'
      );
      tmpQ.setFromEuler(tmpE);
      bone.quaternion.copy(rest[key]).multiply(tmpQ);
    });
  }

  var look = { x: 0, y: 0 };

  function tick(now, dragState) {
    var t = now / 1000;
    var m = readMotion();
    var target = targetPoseFromMotion(m);

    // Soft pursuit so pose changes stay flexible / non-snappy
    Object.keys(target).forEach(function (k) {
      var cur = current[k] || [0, 0, 0];
      var tgt = target[k];
      current[k] = [
        cur[0] + (tgt[0] - cur[0]) * 0.1,
        cur[1] + (tgt[1] - cur[1]) * 0.1,
        cur[2] + (tgt[2] - cur[2]) * 0.1
      ];
    });

    var energy = typeof m.energy === 'number' ? m.energy : 0.35;
    var speed = Math.min(1.6, Math.abs(m.velocity || 0) / 900);
    var breath = Math.sin(t * (1.1 + energy)) * (1 + speed * 0.5);
    var swing = Math.sin(t * (1.4 + speed * 2.2)) * (3 + speed * 10) * (m.side || 1);
    look.x += ((typeof m.lookX === 'number' ? m.lookX : 0) - look.x) * 0.12;
    look.y += ((typeof m.lookY === 'number' ? m.lookY : 0) - look.y) * 0.12;

    var extra = gestureOffsets(m, now);
    if (options.mixamo) {
      Object.keys(bones).forEach(function (key) {
        if (!bones[key] || !rest[key]) return;
        bones[key].quaternion.copy(rest[key]);
      });
      var mixamoKeys = ['head', 'neck'];
      applyBoneOffsets({ head: current.head, neck: current.neck }, 0, 0, look.x, look.y, extra, mixamoKeys);
      if (m.gesture === 'wave' && m.gestureStart && bones.rArm) {
        var wt = (now - m.gestureStart) / 1000;
        if (wt < 2) {
          var attack = Math.min(1, wt / 0.22);
          var release = wt > 1.55 ? Math.max(0, (2 - wt) / 0.45) : 1;
          var w = attack * release;
          var flap = Math.sin(wt * 14) * w;
          bones.rArm.rotation.set(
            THREE.MathUtils.degToRad(18 + (1 - w) * 60),
            THREE.MathUtils.degToRad(-18 * w),
            THREE.MathUtils.degToRad(-55 * w + 18 * flap)
          );
          if (bones.rForearm) {
            bones.rForearm.rotation.set(
              THREE.MathUtils.degToRad(8 + 20 * w),
              THREE.MathUtils.degToRad(0),
              THREE.MathUtils.degToRad(-12 * w + 22 * flap)
            );
          }
        }
      }
    } else {
      applyBoneOffsets(current, breath, swing, look.x, look.y, extra);
    }

    // Whole-rig liveliness (works even when body mesh is unskinned)
    var bob = Math.sin(t * (2.2 + speed * 3)) * (0.012 + speed * 0.045);
    var sway = Math.sin(t * 0.7) * 0.015;
    root.position.y = baseY + bob;
    root.rotation.z = sway * 0.4 + (m.side || 1) * speed * 0.04;
    var pitch = dragState && typeof dragState.pitch === 'number' ? dragState.pitch : 0;
    root.rotation.x = pitch - speed * 0.03;

    if (dragState) {
      if (options.autoRotate && !dragState.active && !dragState.userTurned) {
        dragState.yaw += 0.0018 + speed * 0.004;
      }
      root.rotation.y = dragState.yaw;
    }
  }

  return {
    bones: bones,
    rest: rest,
    tick: tick,
    setPose: function (name) {
      window.__VX_AVATAR_MOTION__.pose = name;
      window.__VX_AVATAR_MOTION__.nextPose = name;
      window.__VX_AVATAR_MOTION__.blend = 1;
    },
    availableBones: Object.keys(bones)
  };
}

export { SECTION_POSES, BONE_ALIASES };
