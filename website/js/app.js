const RANDOM_SUFFIX = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
const RANDOM_PROJECT_NAME = `my-cool-new-thing-${RANDOM_SUFFIX}`;

const PRESET_DATA = {
  'rich-input': [
    {
      id: 'netlify',
      name: 'Netlify',
      target: 'rich-input.netlify.app',
      url: 'https://rich-input.netlify.app',
      available: false,
    },
    {
      id: 'npm',
      name: 'NPM',
      target: 'rich-input',
      url: 'https://www.npmjs.com/package/rich-input',
      available: false,
    },
  ],
  [RANDOM_PROJECT_NAME]: [
    {
      id: 'netlify',
      name: 'Netlify',
      target: `${RANDOM_PROJECT_NAME}.netlify.app`,
      url: `https://${RANDOM_PROJECT_NAME}.netlify.app`,
      available: true,
    },
    {
      id: 'npm',
      name: 'NPM',
      target: RANDOM_PROJECT_NAME,
      url: `https://www.npmjs.com/package/${RANDOM_PROJECT_NAME}`,
      available: true,
    },
  ],
};

/**
 * Create SVG icon for <micro-lighter> copy buttons (matching show-keystrokes demo).
 */
function createCopyIconSvg(isCopied = false) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.margin = 'auto';

  if (isCopied) {
    svg.style.color = '#16a34a';
    const polyline = document.createElementNS(svgNs, 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(polyline);
  } else {
    const rect = document.createElementNS(svgNs, 'rect');
    rect.setAttribute('x', '9');
    rect.setAttribute('y', '9');
    rect.setAttribute('width', '13');
    rect.setAttribute('height', '13');
    rect.setAttribute('rx', '2');
    rect.setAttribute('ry', '2');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
    svg.append(rect, path);
  }

  return svg;
}

/**
 * Enhance <micro-lighter> copy buttons with SVG icons.
 */
function setupMicroLighterCopyButtons() {
  if (typeof customElements === 'undefined') return;

  const enhanceAll = () => {
    document.querySelectorAll('micro-lighter').forEach((lighter) => {
      const button = lighter.shadowRoot?.querySelector('button[part="copy-button"]');
      if (!button || button.dataset.iconEnhanced === 'true') return;
      button.dataset.iconEnhanced = 'true';

      let currentLabel = 'Copy code';
      const renderIcon = (label) => {
        currentLabel = String(label || 'Copy');
        const isCopied = currentLabel.toLowerCase().includes('copied');
        button.setAttribute('aria-label', isCopied ? 'Copied' : 'Copy code');
        button.setAttribute('title', isCopied ? 'Copied' : 'Copy code');
        button.replaceChildren(createCopyIconSvg(isCopied));
      };

      Object.defineProperty(button, 'textContent', {
        configurable: true,
        get() {
          return currentLabel;
        },
        set(value) {
          renderIcon(value);
        },
      });

      renderIcon('Copy');
    });
  };

  if (customElements.get('micro-lighter')) {
    enhanceAll();
  } else {
    customElements.whenDefined('micro-lighter').then(enhanceAll);
  }
}

/**
 * Setup scrollspy for sticky sidebar navigation using CSS scroll-target-group
 * with IntersectionObserver fallback and aria-current synchronization.
 */
function setupScrollspy() {
  const navLinks = document.querySelectorAll('.sidenav-list a');
  const sections = Array.from(navLinks)
    .map((link) => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (sections.length === 0) return;

  if (typeof CSS !== 'undefined' && CSS.supports('scroll-target-group: auto')) {
    const syncAriaCurrent = () => {
      const currentLink = document.querySelector('.sidenav-list a:target-current');
      if (!currentLink) return;
      navLinks.forEach((link) => {
        const isCurrent = link === currentLink;
        link.classList.toggle('is-active', isCurrent);
        link.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      });
    };
    syncAriaCurrent();
    document.addEventListener('scrollend', syncAriaCurrent);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', isActive);
            link.setAttribute('aria-current', isActive ? 'true' : 'false');
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/**
 * Helper to create a styled span inside the terminal preview.
 */
function createSpan(className, text) {
  const span = document.createElement('span');
  if (className) {
    span.className = className;
  }
  span.textContent = text;
  return span;
}

/**
 * Setup interactive CLI command and output preview in #overview.
 */
function setupCliPreview() {
  const randomChip = document.getElementById('preset-random-chip');
  if (randomChip) {
    randomChip.dataset.preset = RANDOM_PROJECT_NAME;
    randomChip.textContent = RANDOM_PROJECT_NAME;
  }

  const presetChips = document.querySelectorAll('.preset-chip');
  const toggleJson = document.getElementById('toggle-json');
  const commandContainer = document.getElementById('preview-command-container');
  const terminalOutput = document.getElementById('terminal-output');
  const exitBadge = document.getElementById('terminal-exit-badge');

  if (!terminalOutput || !commandContainer) return;

  let activePreset = 'rich-input';

  function renderPreview() {
    const isJson = Boolean(toggleJson?.checked);
    const names = activePreset.split(/\s+/).filter(Boolean);
    const cmdText = `npx caniname ${names.join(' ')}${isJson ? ' --json' : ''}`;

    const lighter = document.createElement('micro-lighter');
    lighter.setAttribute('language', 'bash');
    lighter.setAttribute('controls', 'copy');
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.id = 'preview-command-code';
    code.textContent = cmdText;
    pre.appendChild(code);
    lighter.appendChild(pre);
    commandContainer.replaceChildren(lighter);
    setupMicroLighterCopyButtons();

    const entries = names.map((name) => ({
      name,
      results: PRESET_DATA[name] || [],
    }));

    const allAvailable = entries.every((entry) =>
      entry.results.every((r) => r.available && !r.error)
    );

    if (exitBadge) {
      exitBadge.textContent = allAvailable ? 'exit code 0' : 'exit code 1';
      exitBadge.classList.toggle('exit-0', allAvailable);
      exitBadge.classList.toggle('exit-1', !allAvailable);
    }

    if (isJson) {
      const payload = entries.length === 1 ? entries[0] : entries;
      terminalOutput.textContent = JSON.stringify(payload, null, 2);
      return;
    }

    const fragment = document.createDocumentFragment();

    entries.forEach((entry, index) => {
      if (index > 0) {
        fragment.appendChild(document.createTextNode('\n'));
      }
      fragment.appendChild(document.createTextNode('Checking availability for '));
      fragment.appendChild(createSpan('term-bold', entry.name));
      fragment.appendChild(document.createTextNode('…\n\n'));

      const maxNameLen = Math.max(...entry.results.map((r) => r.name.length), 0);

      entry.results.forEach((result) => {
        const label = result.name.padEnd(maxNameLen);
        fragment.appendChild(document.createTextNode('  '));

        if (result.available) {
          fragment.appendChild(createSpan('term-green', '✔'));
          fragment.appendChild(document.createTextNode(' '));
          fragment.appendChild(createSpan('term-bold', label));
          fragment.appendChild(document.createTextNode(`  ${result.target} is `));
          fragment.appendChild(createSpan('term-green', 'available'));
          fragment.appendChild(document.createTextNode('\n'));
        } else {
          fragment.appendChild(createSpan('term-red', '✖'));
          fragment.appendChild(document.createTextNode(' '));
          fragment.appendChild(createSpan('term-bold', label));
          fragment.appendChild(document.createTextNode(`  ${result.target} is `));
          fragment.appendChild(createSpan('term-red', 'taken'));
          fragment.appendChild(document.createTextNode(' '));

          const dimSpan = document.createElement('span');
          dimSpan.className = 'term-dim';
          dimSpan.appendChild(document.createTextNode('('));
          const link = document.createElement('a');
          link.href = result.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = result.url;
          dimSpan.appendChild(link);
          dimSpan.appendChild(document.createTextNode(')'));
          fragment.appendChild(dimSpan);
          fragment.appendChild(document.createTextNode('\n'));
        }
      });
    });

    terminalOutput.replaceChildren(fragment);
  }

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      presetChips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      activePreset = chip.dataset.preset || 'rich-input';
      renderPreview();
    });
  });

  toggleJson?.addEventListener('change', renderPreview);

  renderPreview();
}

setupMicroLighterCopyButtons();
setupScrollspy();
setupCliPreview();
