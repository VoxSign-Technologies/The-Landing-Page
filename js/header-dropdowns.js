/**
 * PearlEdu: header notification & profile dropdowns (mobile-safe).
 * On narrow viewports, panels are moved to document.body and positioned with
 * the visual viewport so sticky headers cannot clip or offset them.
 */
(function () {
  'use strict';

  var MOBILE_MQ = window.matchMedia('(max-width: 800px)');
  var backdrop = null;
  var positionRaf = 0;

  function dropdowns() {
    return Array.from(document.querySelectorAll('[data-header-dropdown]'));
  }

  function panelOf(root) {
    return root.querySelector('[data-header-dropdown-panel]');
  }

  function ensureBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'header-dropdown-backdrop';
    backdrop.id = 'header-dropdown-backdrop';
    backdrop.hidden = true;
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.addEventListener('click', closeAll);
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function syncHeaderHeight() {
    var header = document.getElementById('app-header');
    if (header) {
      document.documentElement.style.setProperty('--app-header-h', header.offsetHeight + 'px');
    }
  }

  function clearPanelPlacement(panel) {
    if (!panel) return;
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.maxHeight = '';
    panel.style.bottom = '';
  }

  function restorePanel(panel) {
    if (!panel || !panel.classList.contains('is-ported')) return;
    var home = panel._dropdownHome;
    clearPanelPlacement(panel);
    panel.classList.remove('is-ported');
    if (home && home.isConnected) {
      home.appendChild(panel);
    }
    panel._dropdownHome = null;
  }

  function placePortedPanel(panel) {
    if (!panel || !MOBILE_MQ.matches) return;

    syncHeaderHeight();
    var header = document.getElementById('app-header');
    var headerBottom = header ? header.getBoundingClientRect().bottom : 56;
    var gutter = 12;
    var vv = window.visualViewport;
    var viewTop = vv ? vv.offsetTop : 0;
    var viewHeight = vv ? vv.height : window.innerHeight;
    var viewLeft = vv ? vv.offsetLeft : 0;
    var viewWidth = vv ? vv.width : window.innerWidth;

    var top = Math.max(headerBottom, viewTop) + 8;
    var maxHeight = Math.max(160, viewTop + viewHeight - top - gutter);

    panel.style.position = 'fixed';
    panel.style.left = (viewLeft + gutter) + 'px';
    panel.style.right = 'auto';
    panel.style.width = Math.max(0, viewWidth - gutter * 2) + 'px';
    panel.style.top = top + 'px';
    panel.style.bottom = 'auto';
    panel.style.maxHeight = maxHeight + 'px';
  }

  function portPanel(root, panel) {
    if (!panel || !MOBILE_MQ.matches) return;
    if (!panel.classList.contains('is-ported')) {
      panel._dropdownHome = root;
      panel.classList.add('is-ported');
      document.body.appendChild(panel);
    }
    placePortedPanel(panel);
  }

  function schedulePlaceOpenPanels() {
    if (positionRaf) cancelAnimationFrame(positionRaf);
    positionRaf = requestAnimationFrame(function () {
      positionRaf = 0;
      dropdowns().forEach(function (root) {
        if (!root.classList.contains('is-open')) return;
        var panel = panelOf(root);
        if (panel && panel.classList.contains('is-ported')) {
          placePortedPanel(panel);
        }
      });
    });
  }

  function syncBackdrop() {
    var open = dropdowns().some(function (el) { return el.classList.contains('is-open'); });
    var mobile = MOBILE_MQ.matches;
    var bd = ensureBackdrop();
    bd.hidden = !(open && mobile);
    bd.setAttribute('aria-hidden', open && mobile ? 'false' : 'true');
    document.body.classList.toggle('header-dropdown-open', open && mobile);
    if (open && mobile) {
      document.body.style.overflow = 'hidden';
    } else if (!document.body.classList.contains('sidebar-open')) {
      document.body.style.overflow = '';
    }
  }

  function closeAll() {
    dropdowns().forEach(function (root) {
      root.classList.remove('is-open');
      var btn = root.querySelector('[data-header-dropdown-trigger]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      restorePanel(panelOf(root));
    });
    syncBackdrop();
  }

  function closeSidebarIfOpen() {
    if (!document.body.classList.contains('sidebar-open')) return;
    document.body.classList.remove('sidebar-open');
    var sidebarBtn = document.getElementById('sidebar-open-btn');
    if (sidebarBtn) {
      sidebarBtn.setAttribute('aria-expanded', 'false');
      sidebarBtn.setAttribute('aria-label', 'Open menu');
    }
    var sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
    var main = document.getElementById('main-content');
    if (main) main.removeAttribute('aria-hidden');
    if (!document.body.classList.contains('header-dropdown-open')) {
      document.body.style.overflow = '';
    }
  }

  function openDropdown(root) {
    var btn = root.querySelector('[data-header-dropdown-trigger]');
    var panel = panelOf(root);
    root.classList.add('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (MOBILE_MQ.matches) {
      portPanel(root, panel);
    } else {
      restorePanel(panel);
      clearPanelPlacement(panel);
    }
    syncBackdrop();
  }

  function bindDropdown(root) {
    if (root.dataset.headerDropdownBound === '1') return;
    root.dataset.headerDropdownBound = '1';

    var btn = root.querySelector('[data-header-dropdown-trigger]');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeSidebarIfOpen();

      var willOpen = !root.classList.contains('is-open');
      closeAll();

      if (willOpen) {
        openDropdown(root);
      }
    });
  }

  function isInsideDropdownUi(target) {
    if (!target || !target.closest) return false;
    if (target.closest('[data-header-dropdown]')) return true;
    if (target.closest('.header-dropdown__panel.is-ported')) return true;
    return false;
  }

  function init() {
    syncHeaderHeight();
    window.addEventListener('resize', function () {
      syncHeaderHeight();
      schedulePlaceOpenPanels();
    });
    window.addEventListener('scroll', schedulePlaceOpenPanels, true);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedulePlaceOpenPanels);
      window.visualViewport.addEventListener('scroll', schedulePlaceOpenPanels);
    }

    dropdowns().forEach(bindDropdown);

    document.addEventListener('click', function (e) {
      if (isInsideDropdownUi(e.target)) return;
      closeAll();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    MOBILE_MQ.addEventListener('change', function () {
      closeAll();
    });

    window.closeHeaderDropdowns = closeAll;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
