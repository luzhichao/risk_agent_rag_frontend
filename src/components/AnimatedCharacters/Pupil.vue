<template>
  <div
    class="pupil"
    :data-max-distance="maxDistance"
    :style="{
      width: size + 'px',
      height: size + 'px',
      borderRadius: '50%',
      backgroundColor: pupilColor,
      willChange: 'transform',
    }"
  />
</template>

<script setup lang="ts">
interface Props {
  size?: number
  maxDistance?: number
  pupilColor?: string
}

withDefaults(defineProps<Props>(), {
  size: 12,
  maxDistance: 5,
  pupilColor: '#2D2D2D',
})
</script>