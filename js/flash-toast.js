(function () {
  document.querySelectorAll('[data-flash-toast]').forEach(function (el) {
    var close = el.querySelector('.flash-toast__close');
    var hide = function () {
      el.classList.add('flash-toast--hide');
      window.setTimeout(function () {
        el.remove();
      }, 220);
    };
    if (close) {
      close.addEventListener('click', hide);
    }
    window.setTimeout(hide, 8000);
  });
})();
