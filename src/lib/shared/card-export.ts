import { toPng } from 'html-to-image'

export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
  options?: {
    pixelRatio?: number
    backgroundColor?: string
  },
) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: options?.pixelRatio ?? 2,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
  })

  downloadDataUrl(dataUrl, filename)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
