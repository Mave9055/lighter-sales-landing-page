// identity.js - minimal utilities for emblem/watermark placeholders
(function() {
  const emblemTargets = document.querySelectorAll('.emblem-letterhead, .emblem-small');
  emblemTargets.forEach(target => {
    target.style.background = 'radial-gradient(circle at 30% 30%, rgba(212, 175, 55, 0.35), transparent 60%), radial-gradient(circle at 70% 70%, rgba(17, 24, 31, 0.45), transparent 60%)';
    target.style.borderRadius = '50%';
    target.style.border = '1px solid rgba(17, 24, 31, 0.15)';
  });
})();
