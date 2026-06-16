<script setup>
defineProps({
  single: { type: Boolean, default: false }
})
</script>

<template>
  <div class="auth-shell">
    <header class="auth-shell__header">
      <img src="/aka.jpg" alt="logo" class="auth-shell__logo" />
      <div>
        <div class="auth-shell__brand-title">软开办公室</div>
        <div class="auth-shell__brand-sub">综合管理平台</div>
      </div>
    </header>
    <main class="auth-shell__main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
@import '@/styles/auth.css';
</style>
