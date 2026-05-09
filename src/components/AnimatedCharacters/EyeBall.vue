<template>
  <div
    class="eyeball"
    :data-max-distance="maxDistance"
    :style="{
      width: size + 'px',
      height: size + 'px',
      borderRadius: '50%',
      backgroundColor: eyeColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      willChange: 'height',
    }"
  >
    <div
      class="eyeball-pupil"
      :style="{
        width: pupilSize + 'px',
        height: pupilSize + 'px',
        borderRadius: '50%',
        backgroundColor: pupilColor,
        willChange: 'transform',
      }"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
}

withDefaults(defineProps<Props>(), {
  size: 48,
  pupilSize: 16,
  maxDistance: 10,
  eyeColor: 'white',
  pupilColor: '#2D2D2D',
})
</script>