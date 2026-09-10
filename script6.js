// script.js — Interactions for TrendyB
// Assumes HTML: top-level panels (main > .panel), sebuleni items wrapped in .sebuleni-item,
// lookbook items in .look-item, designer images in .designer-avatar img.
// Minimal image fallback & load handling for .hero-art img
document.addEventListener('DOMContentLoaded', function () {
  const img = document.querySelector('.hero-art img');
  if (!img) return;

  // Add .loaded class when the image finishes loading (CSS transitions it in)
  img.addEventListener('load', () => img.classList.add('loaded'));

  // If loading fails, try converting "./images/..." to "/images/...", then fall back to an external image
  img.addEventListener('error', function () {
    if (img.dataset.tried === 'root') {
      img.dataset.tried = 'fallback';
      img.src = './images/image.png';
      img.removeAttribute('loading');
      return;
    }

    const orig = img.getAttribute('src') || '';
    if (orig.startsWith('./')) {
      img.dataset.tried = 'root';
      img.src = orig.replace(/^\.\//, '/'); // try site-root path
      return;
    }

    img.dataset.tried = 'fallback';
    img.src = '.images/image.png';
    img.removeAttribute('loading');
  });

  // If the browser cached a previous failed load, force a re-check
  if (img.complete && !img.naturalWidth) {
    const tmp = img.src;
    img.src = '';
    setTimeout(() => (img.src = tmp), 50);
  }
});
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    /* --------------------------
       Mobile nav toggle
       -------------------------- */
    const navToggle = document.getElementById('nav-toggle');
    const mainNavEl = document.getElementById('main-nav');

    if (navToggle && mainNavEl) {
      navToggle.addEventListener('click', () => {
        const isOpen = mainNavEl.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      // close menu after choosing a link (mobile)
      mainNavEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link') && window.innerWidth <= 900) {
          mainNavEl.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* --------------------------
       Broken image fallback
       Replaces any image that fails to load (e.g. missing local
       product photos) with a lightweight branded placeholder so
       the layout still looks intentional.
       -------------------------- */
    function svgPlaceholder(label) {
      const safeLabel = (label || 'Photo coming soon').slice(0, 40);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
        <rect width="600" height="750" fill="#F4EBE4"/>
        <text x="50%" y="50%" font-family="monospace" font-size="24" fill="#7A7488" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', function handler() {
        if (this.dataset.fallbackApplied) return;
        this.dataset.fallbackApplied = 'true';
        this.classList.add('img-fallback');
        this.src = svgPlaceholder(this.alt);
      }, { once: true });
    });

    /* --------------------------
       Panel navigation (top-level panels only)
       -------------------------- */
    const panels = Array.from(document.querySelectorAll('main > .panel'));
    const navLinks = Array.from(document.querySelectorAll('.main-nav .nav-link'));

    function showPanel(id) {
      panels.forEach(p => p.classList.toggle('hidden', p.id !== id));
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      const panel = document.getElementById(id);
      if (panel) {
        const h = panel.querySelector('h2');
        if (h) { h.tabIndex = -1; h.focus(); }
      }
    }

    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        if (!href.startsWith('#')) return;
        e.preventDefault();
        const id = href.slice(1);
        if (!id) return;
        showPanel(id);
        history.replaceState(null, '', '#' + id);
      });
    });

    // Show initial panel from hash or default to 'home'
    const startHash = location.hash ? location.hash.slice(1) : 'home';
    showPanel(startHash);

    /* --------------------------
       Clipboard: copy phone
       -------------------------- */
    const copyBtn = document.getElementById('copy-phone');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const phone = document.getElementById('phone-link')?.textContent?.trim();
        if (!phone) return;
        try {
          await navigator.clipboard.writeText(phone);
          const prev = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(() => { copyBtn.textContent = prev; }, 1400);
        } catch (err) {
          console.error('Clipboard write failed', err);
          copyBtn.textContent = 'Copy ✕';
          setTimeout(() => copyBtn.textContent = 'Copy', 1400);
        }
      });
    }

    /* --------------------------
       Modal helpers (focus trap, open/close)
       -------------------------- */
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');
    const modalPanel = document.getElementById('modal-panel');

    function trapFocus(container) {
      if (!container) return;
      const selectors = 'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])';
      const focusable = Array.from(container.querySelectorAll(selectors));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      container._focusHandler = function (e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      };
      document.addEventListener('keydown', container._focusHandler);
    }

    function releaseFocusTrap(container) {
      if (!container || !container._focusHandler) return;
      document.removeEventListener('keydown', container._focusHandler);
      container._focusHandler = null;
    }

    function openModal(node) {
      if (!modal || !modalContent || !modalClose) return;
      modal._lastFocused = document.activeElement;
      modalContent.innerHTML = '';
      modalContent.appendChild(node);
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      // focus the close button for immediate keyboard control
      modalClose.focus();
      trapFocus(modalPanel);
    }

    function closeModal() {
      if (!modal || !modalContent) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      modalContent.innerHTML = '';
      releaseFocusTrap(modalPanel);
      if (modal._lastFocused && typeof modal._lastFocused.focus === 'function') {
        modal._lastFocused.focus();
      }
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
    });

    /* --------------------------
       Product detail buttons (Style Drop)
       -------------------------- */
    function createProductDetailNode(card) {
      const image = card.querySelector('img')?.cloneNode(true);
      const title = card.querySelector('h3')?.textContent || '';
      const designer = card.querySelector('.designer')?.textContent || '';
      const price = card.querySelector('.tag-chip')?.textContent || '';

      const wrapper = document.createElement('div');
      wrapper.style.maxWidth = '880px';

      if (image) {
        image.style.width = '100%';
        image.style.height = 'auto';
        image.style.borderRadius = '10px';
        wrapper.appendChild(image);
      }

      const h = document.createElement('h3');
      h.textContent = title;
      h.style.margin = '0.75rem 0 0.25rem';
      wrapper.appendChild(h);

      if (designer) {
        const p = document.createElement('p');
        p.textContent = designer;
        p.style.color = 'var(--muted)';
        wrapper.appendChild(p);
      }

      if (price) {
        const pr = document.createElement('p');
        pr.textContent = price;
        pr.style.fontWeight = '700';
        wrapper.appendChild(pr);
      }

      const actions = document.createElement('div');
      actions.style.marginTop = '0.8rem';
      actions.style.display = 'flex';
      actions.style.gap = '0.5rem';

      const addCart = document.createElement('button');
      addCart.className = 'btn';
      addCart.textContent = 'Add to cart';
      addCart.addEventListener('click', () => { addToCart(card.dataset.id); closeModal(); });

      const wish = document.createElement('button');
      wish.className = 'icon-btn';
      wish.textContent = '♡';
      wish.title = 'Add to wishlist';
      wish.addEventListener('click', () => { toggleWish(card.dataset.id); closeModal(); });

      actions.appendChild(addCart);
      actions.appendChild(wish);
      wrapper.appendChild(actions);

      return wrapper;
    }

    document.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const card = document.querySelector(`.card[data-id="${id}"]`);
        if (!card) return;
        const node = createProductDetailNode(card);
        openModal(node);
      });
    });

    /* --------------------------
       Card images open modal
       -------------------------- */
    document.querySelectorAll('.card img').forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        const wrapper = document.createElement('div');
        const clone = img.cloneNode(true);
        clone.style.borderRadius = '10px';
        clone.style.maxWidth = '100%';
        clone.style.height = 'auto';
        wrapper.appendChild(clone);
        openModal(wrapper);
      });
    });

    /* --------------------------
       Open modal for sebuleni and lookbook
       -------------------------- */
    function bindImageModal(selector) {
      const images = Array.from(document.querySelectorAll(selector));
      if (!images.length) return;
      images.forEach(img => {
        img.tabIndex = 0;
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          const wrap = document.createElement('div');
          const clone = img.cloneNode(true);
          clone.style.maxWidth = '100%';
          clone.style.height = 'auto';
          clone.style.borderRadius = '10px';
          wrap.appendChild(clone);
          if (img.alt) {
            const cap = document.createElement('p');
            cap.textContent = img.alt;
            cap.style.color = 'var(--muted)';
            cap.style.marginTop = '0.6rem';
            wrap.appendChild(cap);
          }
          openModal(wrap);
        });
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); img.click(); }
        });
      });
    }

    // sebuleni images
    bindImageModal('#sebuleni-duka .sebuleni-item img');
    // lookbook images
    bindImageModal('.look-item img');

    /* --------------------------
       Horizontal containers: keyboard and wheel scrolling
       (kept for future layouts that go horizontal again)
       -------------------------- */
    function enableHorizontalInteraction(containerSelector) {
      const containers = Array.from(document.querySelectorAll(containerSelector));
      containers.forEach(container => {
        if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '0');

        container.addEventListener('keydown', (e) => {
          const step = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--item-width')) || 300;
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            container.scrollBy({ left: step + 16, behavior: 'smooth' });
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            container.scrollBy({ left: -(step + 16), behavior: 'smooth' });
          }
        });

        container.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            container.scrollLeft += e.deltaY;
            e.preventDefault();
          }
        }, { passive: false });
      });
    }

    enableHorizontalInteraction('#drop-grid');
    enableHorizontalInteraction('.look-grid');
    enableHorizontalInteraction('.designer-grid');

    /* --------------------------
       localStorage cart & wishlist
       -------------------------- */
    const cartCountEl = document.getElementById('cart-count');
    const wishCountEl = document.getElementById('wish-count');

    function readStore(key) {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    }
    function writeStore(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    }

    function refreshCounts() {
      const cart = readStore('trendy_cart');
      const wish = readStore('trendy_wish');
      if (cartCountEl) cartCountEl.textContent = cart.length;
      if (wishCountEl) wishCountEl.textContent = wish.length;
    }
    refreshCounts();

    function addToCart(id) {
      if (!id) return;
      const cart = readStore('trendy_cart');
      if (!cart.includes(id)) cart.push(id);
      writeStore('trendy_cart', cart);
      refreshCounts();
      flash('Added to cart');
    }

    function toggleWish(id) {
      if (!id) return;
      const wish = readStore('trendy_wish');
      const idx = wish.indexOf(id);
      if (idx === -1) wish.push(id); else wish.splice(idx, 1);
      writeStore('trendy_wish', wish);
      refreshCounts();
      flash('Wishlist updated');
    }

    // attach to buttons
    document.querySelectorAll('.add-cart').forEach(btn => btn.addEventListener('click', () => addToCart(btn.dataset.id)));
    document.querySelectorAll('.wish').forEach(btn => btn.addEventListener('click', () => toggleWish(btn.dataset.id)));

    /* --------------------------
       Notify-me handler (simple local store)
       -------------------------- */
    document.querySelectorAll('.notify-me').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = prompt('Enter your email (we will notify when item restocks):');
        if (!email) return;
        const list = readStore('trendy_notify');
        list.push({ id: btn.dataset.id, email, ts: Date.now() });
        writeStore('trendy_notify', list);
        flash('We will notify you at ' + email);
      });
    });

    /* --------------------------
       Style Drop: search + filter
       -------------------------- */
    const dropGrid = document.getElementById('drop-grid');
    const searchInput = document.getElementById('search');
    const dropFilter = document.getElementById('drop-filter');

    function filterDrop() {
      const q = (searchInput?.value || '').toLowerCase().trim();
      const cat = dropFilter?.value || 'all';
      const cards = dropGrid ? Array.from(dropGrid.querySelectorAll('.card')) : [];
      let visibleCount = 0;
      cards.forEach(card => {
        const text = (card.textContent || '').toLowerCase();
        const category = card.dataset.category || '';
        const matchesQ = !q || text.includes(q);
        const matchesCat = cat === 'all' || category === cat;
        const show = matchesQ && matchesCat;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount += 1;
      });
    }
    if (searchInput) searchInput.addEventListener('input', filterDrop);
    if (dropFilter) dropFilter.addEventListener('change', filterDrop);

    /* --------------------------
    Contact form: send via WhatsApp
    -------------------------- */
    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');

    const WHATSAPP_NUMBER = '254734818154';

    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const fm = new FormData(contactForm);
        const name = (fm.get('name') || '').toString().trim();
        const email = (fm.get('email') || '').toString().trim();
        const message = (fm.get('message') || '').toString().trim();

        if (!name || !email || !message) {
          contactStatus.textContent = 'Please fill all fields.';
          contactStatus.style.color = 'crimson';
          return;
        }

        const text =
          `New message from TrendyB website:\n\n` +
          `Name: ${name}\n` +
          `Email: ${email}\n` +
          `Message: ${message}`;

        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

        contactStatus.textContent = 'Opening WhatsApp…';
        contactStatus.style.color = 'var(--muted)';

        // Open WhatsApp in a new tab with the message pre-filled
        window.open(url, '_blank', 'noopener');

        setTimeout(() => {
          contactStatus.textContent = 'If WhatsApp didn\'t open, please message us directly at ' + WHATSAPP_NUMBER + '.';
          contactStatus.style.color = 'var(--muted)';
          contactForm.reset();
        }, 800);
      });
    }

    /* --------------------------
       Small transient flash messages
       -------------------------- */
    function flash(msg) {
      const el = document.createElement('div');
      el.textContent = msg;
      el.style.position = 'fixed';
      el.style.right = '1rem';
      el.style.top = '1rem';
      el.style.padding = '0.6rem 0.9rem';
      el.style.background = 'rgba(23,18,31,0.95)';
      el.style.color = '#fff';
      el.style.borderRadius = '8px';
      el.style.zIndex = 120;
      el.style.transition = 'opacity 300ms';
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; }, 2000);
      setTimeout(() => { el.remove(); }, 2500);
    }

    /* --------------------------
       Expose minimal API for other scripts
       -------------------------- */
    window.TrendyB = {
      addToCart,
      toggleWish,
      openModal // allow other scripts to open the modal with a node
    };
  });
})();
// Cover overlay script — improved Enter/Space handling + debug
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const cover = document.getElementById('cover');
    const canvas = document.getElementById('cover-canvas');
    const enterBtn = document.getElementById('enter-site');
    const skipBtn = document.getElementById('skip-cover');
    const closeBtn = document.getElementById('cover-close');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!cover) {
      console.warn('Cover: #cover element not found');
      return;
    }

    // Quick debug: show nodes found
    console.debug('Cover init', { enterBtn, skipBtn, closeBtn });

    // Optionally hide cover if user already dismissed it
    const STORAGE_KEY = 'trendyb_cover_seen_v1';
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      cover.classList.add('hide');
      cover.style.display = 'none';
      return;
    }

    // Accessibility: hide main content while cover active
    const pageNodes = document.querySelectorAll('header.site-header, main, footer.site-footer');
    pageNodes.forEach(n => n.setAttribute('aria-hidden', 'true'));

    // Focus management: move focus to Enter button if available
    if (enterBtn) {
      enterBtn.focus({ preventScroll: true });
    } else {
      // fallback: focus the cover to catch keystrokes
      cover.setAttribute('tabindex', '-1');
      cover.focus({ preventScroll: true });
    }

    function closeCover(save = true) {
      if (save) localStorage.setItem(STORAGE_KEY, 'true');
      pageNodes.forEach(n => n.removeAttribute('aria-hidden'));
      cover.classList.add('hide');
      setTimeout(() => { cover.style.display = 'none'; }, 450);
      console.debug('Cover closed', { saved: !!save });
    }

    // click handlers
    enterBtn?.addEventListener('click', () => closeCover(true));
    skipBtn?.addEventListener('click', () => closeCover(true));
    closeBtn?.addEventListener('click', () => closeCover(false));

    // Keyboard handling: Escape to close; Enter/Space also close the cover even if focus is elsewhere
    document.addEventListener('keydown', (e) => {
      if (!cover || cover.style.display === 'none') return;

      // Escape still closes without saving
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCover(false);
        return;
      }

      // If Enter or Space, treat as "enter site" action (save)
      if (e.key === 'Enter' || e.key === ' ') {
        // ignore Enter/Space when the focused element is an input or textarea
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
          return;
        }
        e.preventDefault();
        // Optionally animate the button press for feedback
        if (enterBtn) {
          enterBtn.classList.add('active-press');
          setTimeout(() => enterBtn.classList.remove('active-press'), 180);
        }
        closeCover(true);
      }

      // focus trap (Tab)
      if (e.key === 'Tab') {
        const focusable = cover.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  });
})();
document.addEventListener('DOMContentLoaded', () => {
  const panels = () => Array.from(document.querySelectorAll('main .panel'));

  function showPanel(hash) {
    if (!hash) return;
    const id = hash.startsWith('#') ? hash.slice(1) : hash;
    const target = document.getElementById(id);
    if (!target) return;

    panels().forEach(p => {
      if (p.id === id) {
        p.classList.remove('hidden');
        p.classList.add('visible');
      } else {
        p.classList.add('hidden');
        p.classList.remove('visible');
      }
    });

    // Update nav active state (main nav + footer links)
    document.querySelectorAll('.main-nav .nav-link, .footer-links .nav-link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === ('#' + id));
    });
  }

  // Delegate handler for any in-page link (anchors with href starting #)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute('href');
    // ignore empty or just "#" links
    if (!href || href === '#') return;

    // If the target is inside the page (same-document)
    if (href.startsWith('#')) {
      e.preventDefault();
      showPanel(href);
      // update URL hash without adding a new history entry
      history.replaceState(null, '', href);

      // scroll the shown panel into view smoothly
      const targetEl = document.querySelector(href);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // move focus for accessibility
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
        // remove the temporary tabindex after focus moves
        setTimeout(() => targetEl.removeAttribute('tabindex'), 1000);
      }
    }
  });

  // If page loads with a hash, show that panel
  if (location.hash) {
    showPanel(location.hash);
    // optionally scroll after a short delay so layout is ready
    setTimeout(() => {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
});
// FAQ accordion — Contact Us section
document.addEventListener('DOMContentLoaded', () => {
  const faqItems = Array.from(document.querySelectorAll('#faq-list .faq-item'));
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    const icon = item.querySelector('.faq-icon');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // close all other items (accordion behavior — remove this loop
      // if you want multiple answers open at once)
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-question');
          const otherIcon = other.querySelector('.faq-icon');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherIcon) otherIcon.textContent = '+';
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (icon) icon.textContent = !isOpen ? '−' : '+';
    });
  });
});
// Cart view — clicking the cart button shows what's inside
document.addEventListener('DOMContentLoaded', () => {
  const cartBtn = document.getElementById('cart-btn');
  if (!cartBtn) return;

  const STORE_KEY = 'trendy_cart';

  function readCart() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch { return []; }
  }

  function writeCart(ids) {
    localStorage.setItem(STORE_KEY, JSON.stringify(ids));
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = ids.length;
  }

  // Pull display info (image, title, price) for a given product id
  // from the matching product card already on the page.
  function getProductInfo(id) {
    const card = document.querySelector(`.card[data-id="${id}"]`);
    if (!card) {
      return { id, title: 'Item', price: '', img: '' };
    }
    return {
      id,
      title: card.querySelector('h3')?.textContent?.trim() || 'Item',
      price: card.querySelector('.tag-chip')?.textContent?.trim() || '',
      img: card.querySelector('img')?.getAttribute('src') || ''
    };
  }

  function buildCartNode() {
    const ids = readCart();
    const wrapper = document.createElement('div');
    wrapper.className = 'cart-list';

    const heading = document.createElement('h3');
    heading.textContent = `Your Cart (${ids.length})`;
    wrapper.appendChild(heading);

    if (!ids.length) {
      const empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.textContent = "Your cart is empty — go find something you'll love.";
      wrapper.appendChild(empty);
      return wrapper;
    }

    let total = 0;

    ids.forEach(id => {
      const info = getProductInfo(id);
      const row = document.createElement('div');
      row.className = 'cart-row';

      const img = document.createElement('img');
      img.src = info.img;
      img.alt = info.title;
      row.appendChild(img);

      const details = document.createElement('div');
      details.className = 'cart-row-info';

      const h4 = document.createElement('h4');
      h4.textContent = info.title;
      details.appendChild(h4);

      const p = document.createElement('p');
      p.textContent = info.price;
      details.appendChild(p);

      // Try to add up a running total if the price is "KSh 3,500" style
      const numeric = parseFloat((info.price || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(numeric)) total += numeric;

      row.appendChild(details);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'cart-row-remove';
      removeBtn.title = 'Remove from cart';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        const updated = readCart().filter(existingId => existingId !== id);
        writeCart(updated);
        // re-render the modal content in place
        if (window.TrendyB && typeof window.TrendyB.openModal === 'function') {
          window.TrendyB.openModal(buildCartNode());
        }
      });
      row.appendChild(removeBtn);

      wrapper.appendChild(row);
    });

    if (total > 0) {
      const summary = document.createElement('div');
      summary.className = 'cart-summary';
      summary.innerHTML = `<span>Total</span><span>KSh ${total.toLocaleString()}</span>`;
      wrapper.appendChild(summary);
    }

    return wrapper;
  }

  cartBtn.addEventListener('click', () => {
    if (window.TrendyB && typeof window.TrendyB.openModal === 'function') {
      window.TrendyB.openModal(buildCartNode());
    } else {
      console.warn('Cart view: window.TrendyB.openModal is not available yet.');
    }
  });
});
/* ============ COOKIE CONSENT WIDGET LOGIC ============ */
const CC_STORAGE_KEY = 'cookieConsent';
const CC_COOKIE_DAYS = 180;

function ccSetCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function ccGetCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function ccGetConsent() {
  const raw = ccGetCookie(CC_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function ccSaveConsent(consent) {
  consent.timestamp = new Date().toISOString();
  ccSetCookie(CC_STORAGE_KEY, JSON.stringify(consent), CC_COOKIE_DAYS);
  ccApplyConsent(consent);
  document.getElementById('cc-banner').style.display = 'none';
  document.getElementById('cc-modal-overlay').style.display = 'none';
}

function ccAcceptAll() {
  ccSaveConsent({ necessary: true, analytics: true, marketing: true, preferences: true });
}

function ccRejectAll() {
  ccSaveConsent({ necessary: true, analytics: false, marketing: false, preferences: false });
}

function ccSavePreferences() {
  ccSaveConsent({
    necessary: true,
    analytics: document.getElementById('cc-cat-analytics').checked,
    marketing: document.getElementById('cc-cat-marketing').checked,
    preferences: document.getElementById('cc-cat-preferences').checked
  });
}

function ccOpenModal() {
  const consent = ccGetConsent();
  if (consent) {
    document.getElementById('cc-cat-analytics').checked = !!consent.analytics;
    document.getElementById('cc-cat-marketing').checked = !!consent.marketing;
    document.getElementById('cc-cat-preferences').checked = !!consent.preferences;
  }
  document.getElementById('cc-modal-overlay').style.display = 'flex';
}

function ccCloseModalOnOverlayClick(e) {
  if (e.target.id === 'cc-modal-overlay') {
    document.getElementById('cc-modal-overlay').style.display = 'none';
  }
}
document.getElementById('cc-modal-overlay').addEventListener('click', ccCloseModalOnOverlayClick);

// This is where you hook up real scripts (Google Analytics, Meta Pixel, etc.)
// based on what the visitor consented to.
function ccApplyConsent(consent) {
  if (consent.analytics) {
    console.log('Analytics cookies enabled');
    // e.g. inject your Google Analytics script tag here
  }
  if (consent.marketing) {
    console.log('Marketing cookies enabled');
    // e.g. inject your Meta Pixel / ad script tag here
  }
  if (consent.preferences) {
    console.log('Preference cookies enabled');
  }
}

// On page load: show banner only if no prior consent saved
(function ccInit() {
  const consent = ccGetConsent();
  if (consent) {
    ccApplyConsent(consent);
  } else {
    document.getElementById('cc-banner').style.display = 'flex';
  }
})();