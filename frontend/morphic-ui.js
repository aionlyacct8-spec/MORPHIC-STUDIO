(function () {
  const shellMessages = {
    share: 'Sharing needs auth/users plus a share-link API. This control is intentionally parked until collaboration is added.',
    export: 'Export needs a rendering/export pipeline. Add it after saved chapters, assets, and storage are stable.',
    generate: 'Generation needs a connected AI/render provider and saved project assets first.',
    settings: 'Settings needs user/workspace preferences and authentication first.',
    notifications: 'Notifications need accounts plus a job/event notification service.',
    account_circle: 'Account/profile controls need the authentication system first.',
    help: 'Help/support content is not wired yet. Add documentation/support pages when product flows are stable.',
    help_outline: 'Help/support content is not wired yet. Add documentation/support pages when product flows are stable.',
    queue_play_next: 'Queue controls need the background job queue UI and generation jobs to be fully connected.',
    download: 'Download needs file storage/export URLs. Save assets with file URLs first.',
    auto_fix_high: 'Auto-fix needs a rendering/generation provider integration.',
    auto_fix: 'Auto-fix needs a rendering/generation provider integration.',
    brush: 'Brush/editor tools need a canvas editor or embedded open-source editor before this can be active.',
    layers: 'Layer controls need a canvas/timeline editor integration.',
    timeline: 'Timeline controls need saved sequence/cue editing before this can be active.',
  };

  function toast(message, tone = 'info') {
    const existing = document.getElementById('morphic-global-toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'morphic-global-toast';
    el.setAttribute('role', 'status');
    el.className = [
      'fixed', 'bottom-16', 'left-1/2', '-translate-x-1/2', 'z-[9999]',
      'max-w-[min(92vw,560px)]', 'rounded-xl', 'border', 'px-5', 'py-3',
      'text-sm', 'font-sans', 'shadow-2xl', 'backdrop-blur-xl'
    ].join(' ');
    el.style.background = tone === 'warn' ? 'rgba(69, 45, 8, 0.94)' : 'rgba(13, 28, 45, 0.96)';
    el.style.borderColor = tone === 'warn' ? 'rgba(251, 191, 36, 0.45)' : 'rgba(192, 193, 255, 0.35)';
    el.style.color = tone === 'warn' ? '#fde68a' : '#d4e4fa';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  function textFor(el) {
    const explicit = el.dataset?.featureNote;
    if (explicit) return explicit;

    const icon = el.querySelector?.('.material-symbols-outlined')?.textContent?.trim();
    if (icon && shellMessages[icon]) return shellMessages[icon];

    const label = (el.textContent || el.getAttribute('aria-label') || el.title || 'This control').replace(/\s+/g, ' ').trim();
    const lower = label.toLowerCase();
    for (const [key, message] of Object.entries(shellMessages)) {
      if (lower.includes(key.replace(/_/g, ' '))) return message;
    }
    if (lower.includes('voice') || lower.includes('music')) return 'Voice/music needs an audio generation or audio library integration after scripts, characters, and scenes are saved.';
    if (lower.includes('forgot')) return 'Password reset needs real authentication/email delivery before it can be active.';
    return `${label || 'This control'} is a prototype control. It is marked instead of left blank so you know it still needs a backend API, auth, storage, or open-source editor integration.`;
  }

  function markShellControl(el) {
    if (el.dataset.morphicBound === 'true') return;
    el.dataset.morphicBound = 'true';
    el.dataset.prototype = 'true';
    el.setAttribute('aria-disabled', 'true');
    if (!el.title) el.title = 'Prototype control — not connected yet';
    el.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toast(textFor(el), 'warn');
    });
  }

  function hasRealHandler(el) {
    if (el.hasAttribute('onclick')) return true;
    if (el.closest('form') && (el.type === 'submit' || el.getAttribute('type') === 'submit')) return true;
    if (el.dataset.featureNote) return false;
    return false;
  }

  function boot() {
    document.querySelectorAll('a[href="#"]').forEach(markShellControl);
    document.querySelectorAll('button').forEach((button) => {
      if (hasRealHandler(button)) return;
      markShellControl(button);
    });
  }

  window.MorphicUI = { toast, markShellControl };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
