type ElementPngOptions = {
  pixelRatio?: number
  backgroundColor?: string
  cacheBust?: boolean
  fontEmbedCSS?: string
  width?: number
  height?: number
  canvasWidth?: number
  canvasHeight?: number
  style?: Partial<CSSStyleDeclaration>
}

export async function elementToPngDataUrl(
  element: HTMLElement,
  options?: ElementPngOptions,
) {
  const { toPng } = await import('html-to-image')

  return toPng(element, {
    cacheBust: options?.cacheBust ?? true,
    pixelRatio: options?.pixelRatio ?? 2,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
    fontEmbedCSS: options?.fontEmbedCSS,
    width: options?.width,
    height: options?.height,
    canvasWidth: options?.canvasWidth,
    canvasHeight: options?.canvasHeight,
    style: options?.style,
  })
}

export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
  options?: ElementPngOptions,
) {
  const dataUrl = await elementToPngDataUrl(element, options)
  downloadDataUrl(dataUrl, filename)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
