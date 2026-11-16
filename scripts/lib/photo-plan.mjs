export function photoId(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/-HDR$/i, '')
}

export function targetSize(w, h, maxEdge = 2400) {
  const longest = Math.max(w, h)
  if (longest <= maxEdge) return { width: w, height: h }
  const k = maxEdge / longest
  return { width: Math.round(w * k), height: Math.round(h * k) }
}
