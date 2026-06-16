/** 取用户显示名首字（中文或字母） */
export function getAvatarLetter(user) {
  const name = user?.real_name || user?.username || '?'
  return name.trim().charAt(0).toUpperCase()
}

/** 根据用户名生成稳定头像背景色 */
export function getAvatarColor(user) {
  const str = user?.username || 'user'
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const hues = [175, 200, 210, 190, 180]
  const h = hues[Math.abs(hash) % hues.length]
  return `hsl(${h}, 45%, 42%)`
}
