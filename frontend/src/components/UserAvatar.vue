<script setup>
import { computed } from 'vue'
import { getAvatarLetter, getAvatarColor } from '@/utils/avatar'

const props = defineProps({
  user: { type: Object, default: null },
  size: { type: Number, default: 40 }
})

const letter = computed(() => getAvatarLetter(props.user))
const bgColor = computed(() => getAvatarColor(props.user))
</script>

<template>
  <div
    class="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.45}px`, background: bgColor }"
  >
    {{ letter }}
  </div>
</template>

<style scoped>
.user-avatar {
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  font-family: 'Kingsoft Cloud Font', 'Alimama ShuHeiTi', 'Microsoft YaHei', sans-serif;
}
</style>
