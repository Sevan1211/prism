export function pdfRenderSize(cropWidth: number, cropHeight: number, displayWidth: number, pixelRatio: number, detail = false) {
  const pixelBudget = detail ? 16_000_000 : 6_000_000
  const desired = Math.max(1, displayWidth / cropWidth * Math.min(3, Math.max(1, pixelRatio)))
  const scale = Math.min(desired, 12, 8192 / Math.max(cropWidth, cropHeight), Math.sqrt(pixelBudget / (cropWidth * cropHeight)))
  return { scale, width: Math.ceil(cropWidth * scale), height: Math.ceil(cropHeight * scale) }
}
