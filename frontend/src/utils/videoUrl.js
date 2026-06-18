/** 仅返回 MP4 视频地址 */
export function videoPlayUrl(item) {
  if (!item) return ''
  const url = item.url || item.video_url
  if (url && /\.mp4(\?|$)/i.test(url)) return url
  return ''
}

export function isMp4Url(url) {
  return !!url && /\.mp4(\?|$)/i.test(url)
}
