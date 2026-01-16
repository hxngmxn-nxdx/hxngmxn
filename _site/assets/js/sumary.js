(function() {
  const container = document.querySelector('[data-sumary]');
  const list = document.querySelector('[data-sumary-list]');
  const content = document.querySelector('.post-content');

  if (!container || !list || !content) {
    return;
  }

  const headings = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const wrapper = container.closest('.post-aside');

  if (!headings.length) {
    wrapper ? wrapper.remove() : container.remove();
    return;
  }

  const usedIds = new Set();

  function slugify(text) {
    return (
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'section'
    );
  }

  function uniqueId(base) {
    let candidate = base || 'section';
    let counter = 2;
    while (usedIds.has(candidate)) {
      candidate = `${base}-${counter++}`;
    }
    usedIds.add(candidate);
    return candidate;
  }

  headings.forEach(function(heading) {
    const text = heading.textContent.trim();
    if (!text) {
      return;
    }

    const level = parseInt(heading.tagName.slice(1), 10) || 1;
    const rawId = heading.id && heading.id.trim();
    const id = uniqueId(rawId || slugify(text));
    heading.id = id;

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = text;
    link.className = `sumary-link level-${level}`;
    link.setAttribute('data-level', level);
    item.appendChild(link);
    list.appendChild(item);
  });

  if (!list.children.length) {
    wrapper ? wrapper.remove() : container.remove();
    return;
  }

  container.hidden = false;
})();
