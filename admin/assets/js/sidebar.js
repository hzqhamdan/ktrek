// admin/assets/js/sidebar.js
// Vanilla JS behavior to mimic the original React sidebar:
// - Desktop: collapsed by default, expands on hover
// - Mobile: hamburger opens overlay, X closes

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var sidebar = document.getElementById("ktSidebar");
    if (!sidebar) return;

    var overlay = document.getElementById("ktSidebarOverlay");
    var openBtn = document.getElementById("ktSidebarOpenBtn");
    var closeBtn = document.getElementById("ktSidebarCloseBtn");

    var mqDesktop = window.matchMedia("(min-width: 768px)");

    function setCollapsed(collapsed) {
      sidebar.setAttribute("data-collapsed", collapsed ? "true" : "false");
    }

    // Default to collapsed on desktop
    if (mqDesktop.matches) {
      setCollapsed(true);
    }

    sidebar.addEventListener("mouseenter", function () {
      if (!mqDesktop.matches) return;
      setCollapsed(false);
    });

    sidebar.addEventListener("mouseleave", function () {
      if (!mqDesktop.matches) return;
      setCollapsed(true);
    });

    function openOverlay() {
      if (!overlay) return;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeOverlay() {
      if (!overlay) return;
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openOverlay();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        closeOverlay();
      });
    }

    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeOverlay();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeOverlay();
    });

    // Close overlay when a nav link is clicked (mobile)
    sidebar.addEventListener("click", function (e) {
      var target = e.target;
      if (!(target instanceof Element)) return;
      var link = target.closest("a.kt-sidebar-link");
      if (!link) return;
      if (!mqDesktop.matches) closeOverlay();
    });

    mqDesktop.addEventListener("change", function (ev) {
      if (ev.matches) {
        closeOverlay();
        setCollapsed(true);
      } else {
        setCollapsed(true);
      }
    });

    // Highlight active item by currently visible section (admin uses tabbed sections)
    function syncActiveFromSections() {
      var activeSection = document.querySelector('.content-section.active');
      if (!activeSection) return;
      var activeId = activeSection.getAttribute('id');
      if (!activeId) return;

      var links = sidebar.querySelectorAll('a.kt-sidebar-link');
      links.forEach(function (a) {
        if (a.getAttribute('data-tab') === activeId) {
          a.setAttribute('aria-current', 'page');
        } else {
          a.removeAttribute('aria-current');
        }
      });
    }

    syncActiveFromSections();

    var observer = new MutationObserver(function () {
      syncActiveFromSections();
    });

    var contentSections = document.querySelector('.content-sections');
    if (contentSections) {
      observer.observe(contentSections, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
  });
})();
