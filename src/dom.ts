export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

export function createImage(src: string, alt = '', className?: string) {
  const image = document.createElement('img');
  image.src = src.startsWith('/') ? src.slice(1) : src;
  image.alt = alt;
  image.draggable = false;

  if (className) {
    image.className = className;
  }

  return image;
}
