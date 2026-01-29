import { useEffect } from 'react';

function upsertMeta(name, content, attr = 'name') {
  if (!content) return;
  const selector = `${attr}="${name}"`;
  let el = document.querySelector(`meta[${selector}]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function Seo({ title, description, ogTitle, ogDescription, ogImage }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    if (description) upsertMeta('description', description);
    if (ogTitle) upsertMeta('og:title', ogTitle, 'property');
    if (ogDescription) upsertMeta('og:description', ogDescription, 'property');
    if (ogImage) upsertMeta('og:image', ogImage, 'property');

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, ogTitle, ogDescription, ogImage]);

  return null;
}
