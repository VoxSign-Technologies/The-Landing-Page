(function () {
  var form = document.getElementById('clock-form');
  var input = document.getElementById('badge-code');
  var source = document.getElementById('clock-source');
  var btnCamera = document.getElementById('camera-scan');
  var video = document.getElementById('camera-preview');
  var hint = document.getElementById('camera-hint');
  var cameraErr = document.getElementById('camera-error');
  var cameraPick = document.getElementById('camera-device');
  var cfgPrefix = document.getElementById('scanner-prefix');
  var cfgSuffix = document.getElementById('scanner-suffix');
  var cfgSave = document.getElementById('scanner-save');
  var cfgStatus = document.getElementById('scanner-cfg-status');

  if (!form || !input) {
    return;
  }

  var STORAGE_KEY = 'pearledu-staff-clock-scanner';
  var BADGE_RE = /PE\d{4}[A-Z0-9]{8}/i;
  var stream = null;
  var timer = null;
  var lastKeyAt = 0;
  var scanBuffer = '';

  function loadConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function saveConfig(partial) {
    var cfg = Object.assign(loadConfig(), partial || {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    return cfg;
  }

  function normalizeCode(raw) {
    var text = String(raw || '').trim();
    var cfg = loadConfig();
    if (cfg.stripPrefix && text.indexOf(cfg.stripPrefix) === 0) {
      text = text.slice(cfg.stripPrefix.length);
    }
    if (cfg.stripSuffix && text.slice(-cfg.stripSuffix.length) === cfg.stripSuffix) {
      text = text.slice(0, -cfg.stripSuffix.length);
    }
    var match = text.match(BADGE_RE);
    if (match) {
      return match[0].toUpperCase();
    }
    return text.toUpperCase();
  }

  function setSource(kind) {
    if (source) {
      source.value = kind;
    }
  }

  function submitCode(kind) {
    var code = normalizeCode(input.value);
    if (!code) {
      return;
    }
    input.value = code;
    setSource(kind);
    form.submit();
  }

  function focusInput() {
    window.setTimeout(function () {
      if (input && document.contains(input)) {
        input.focus();
        input.select();
      }
    }, 60);
  }

  function showCameraError(message) {
    if (cameraErr) {
      cameraErr.textContent = message || '';
      cameraErr.hidden = !message;
    }
    if (hint && message) {
      hint.textContent = message;
    }
  }

  function cameraErrorMessage(err) {
    if (!err) {
      return 'Could not start the camera.';
    }
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Camera blocked. Click the lock icon in Chrome’s address bar → Site settings → Allow camera, then tap Use camera again.';
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'No camera found. Plug in a USB webcam or use a USB QR scanner instead.';
    }
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return 'Camera is busy (another app may be using it). Close other apps and try again.';
    }
    if (err.name === 'OverconstrainedError') {
      return 'Saved camera is unavailable. Pick another camera from the list and try again.';
    }
    if (err.name === 'SecurityError') {
      return 'Camera needs HTTPS. Open PearlEdu with https:// in the address bar.';
    }
    return 'Camera error: ' + (err.message || err.name || 'unknown');
  }

  function initConfigUi() {
    var cfg = loadConfig();
    if (cfgPrefix) {
      cfgPrefix.value = cfg.stripPrefix || '';
    }
    if (cfgSuffix) {
      cfgSuffix.value = cfg.stripSuffix || '';
    }
    if (cfgSave) {
      cfgSave.addEventListener('click', function () {
        saveConfig({
          stripPrefix: cfgPrefix ? cfgPrefix.value : '',
          stripSuffix: cfgSuffix ? cfgSuffix.value : '',
          cameraDeviceId: cameraPick ? cameraPick.value : '',
        });
        if (cfgStatus) {
          cfgStatus.textContent = 'Saved on this device.';
        }
        focusInput();
      });
    }
  }

  function stopCamera() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    stream = null;
    if (video) {
      video.hidden = true;
      video.srcObject = null;
    }
    if (btnCamera) {
      btnCamera.textContent = 'Use camera';
    }
  }

  function pickDefaultDevice(devices) {
    var i;
    for (i = 0; i < devices.length; i++) {
      if (/back|rear|environment/i.test(devices[i].label || '')) {
        return devices[i].deviceId;
      }
    }
    for (i = 0; i < devices.length; i++) {
      if (/usb|webcam|logitech|hd pro|camera/i.test(devices[i].label || '')) {
        return devices[i].deviceId;
      }
    }
    return devices[0] ? devices[0].deviceId : '';
  }

  function fillCameraList(devices, preferredId) {
    if (!cameraPick) {
      return pickDefaultDevice(devices);
    }
    var cfg = loadConfig();
    var chosen = preferredId || cfg.cameraDeviceId || pickDefaultDevice(devices);
    var hasChosen = false;
    cameraPick.innerHTML = '';
    devices.forEach(function (device) {
      var opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.textContent = device.label || ('Camera ' + (cameraPick.options.length + 1));
      if (device.deviceId === chosen) {
        opt.selected = true;
        hasChosen = true;
      }
      cameraPick.appendChild(opt);
    });
    if (!hasChosen && devices[0]) {
      cameraPick.value = devices[0].deviceId;
    }
    cameraPick.hidden = devices.length <= 1;
    return cameraPick.value || chosen;
  }

  function buildVideoConstraints(deviceId) {
    if (deviceId) {
      return { video: { deviceId: { ideal: deviceId }, facingMode: { ideal: 'environment' } }, audio: false };
    }
    return { video: { facingMode: { ideal: 'environment' } }, audio: false };
  }

  async function openCameraStream(deviceId) {
    var attempts = [
      buildVideoConstraints(deviceId),
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false },
    ];
    var lastErr = null;
    var i;
    for (i = 0; i < attempts.length; i++) {
      try {
        return await navigator.mediaDevices.getUserMedia(attempts[i]);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Could not open camera');
  }

  async function startCamera(deviceId) {
    if (!navigator.mediaDevices || !video) {
      throw new Error('Camera API not available in this browser');
    }
    stopCamera();
    showCameraError('');

    stream = await openCameraStream(deviceId);
    video.srcObject = stream;
    video.hidden = false;

    try {
      await video.play();
    } catch (playErr) {
      // Some Chrome builds need a direct play() retry after srcObject is set.
      await new Promise(function (resolve) {
        window.setTimeout(resolve, 100);
      });
      await video.play();
    }

    var devices = (await navigator.mediaDevices.enumerateDevices()).filter(function (d) {
      return d.kind === 'videoinput';
    });
    var activeId = fillCameraList(devices, deviceId);
    if (activeId) {
      saveConfig({ cameraDeviceId: activeId });
    }

    if (btnCamera) {
      btnCamera.textContent = 'Stop camera';
    }
    if (hint) {
      hint.textContent = 'Point at the staff ID QR. Scanning starts automatically when a code is read.';
    }

    if ('BarcodeDetector' in window) {
      var detector = new BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] });
      timer = setInterval(async function () {
        try {
          var codes = await detector.detect(video);
          if (!codes.length) {
            return;
          }
          var raw = (codes[0].rawValue || '').trim();
          if (!raw) {
            return;
          }
          input.value = raw;
          stopCamera();
          submitCode('camera');
        } catch (err) {}
      }, 300);
    } else if (hint) {
      hint.textContent = 'Camera preview is on, but this browser cannot decode QR codes. Use Chrome/Edge or a USB scanner.';
    }
  }

  function bindCameraUi() {
    if (!btnCamera) {
      return;
    }

    btnCamera.addEventListener('click', async function () {
      if (stream) {
        stopCamera();
        focusInput();
        return;
      }

      if (!window.isSecureContext) {
        showCameraError('Camera requires HTTPS. Use https:// in the address bar.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraError('This browser does not support camera access. Use Chrome/Edge or a USB scanner.');
        return;
      }

      showCameraError('Starting camera…');
      try {
        var cfg = loadConfig();
        var preferred = (cameraPick && cameraPick.value) || cfg.cameraDeviceId || '';
        await startCamera(preferred);
        showCameraError('');
      } catch (err) {
        if (err && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
          saveConfig({ cameraDeviceId: '' });
        }
        showCameraError(cameraErrorMessage(err));
        stopCamera();
      }
    });

    if (cameraPick) {
      cameraPick.addEventListener('change', async function () {
        saveConfig({ cameraDeviceId: cameraPick.value });
        if (!stream) {
          return;
        }
        try {
          await startCamera(cameraPick.value);
        } catch (err) {
          showCameraError(cameraErrorMessage(err));
          stopCamera();
        }
      });
    }
  }

  input.addEventListener('keydown', function (event) {
    var now = Date.now();
    if (event.key === 'Enter') {
      event.preventDefault();
      submitCode(scanBuffer.length >= 4 ? 'scan' : 'typed');
      scanBuffer = '';
      return;
    }
    if (event.key.length === 1) {
      if (now - lastKeyAt > 120) {
        scanBuffer = '';
      }
      scanBuffer += event.key;
      lastKeyAt = now;
      if (scanBuffer.length >= 4) {
        setSource('scan');
      } else {
        setSource('typed');
      }
    }
  });

  input.addEventListener('input', function () {
    var val = normalizeCode(input.value);
    if (BADGE_RE.test(val)) {
      setSource('scan');
      var cfg = loadConfig();
      if (cfg.autoSubmit !== false) {
        window.clearTimeout(input._autoTimer);
        input._autoTimer = window.setTimeout(function () {
          if (BADGE_RE.test(normalizeCode(input.value))) {
            submitCode('scan');
          }
        }, 80);
      }
    }
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }
    if (target.closest('a, button, select, textarea, label, summary, video, option, details')) {
      return;
    }
    if (stream) {
      return;
    }
    focusInput();
  });

  initConfigUi();
  bindCameraUi();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (hint) {
      hint.textContent = 'Use a USB scanner in the box, or type the staff ID code.';
    }
    if (btnCamera) {
      btnCamera.hidden = true;
    }
  } else if (hint) {
    hint.textContent = 'Tap Use camera (Chrome will ask permission). USB scanners type directly into the box.';
  }

  focusInput();
})();
