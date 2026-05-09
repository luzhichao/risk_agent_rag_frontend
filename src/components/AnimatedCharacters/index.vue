<template>
  <div ref="containerRef" class="animated-characters">
    <!-- 紫色人物 - 最高的人物 -->
    <div
      ref="purpleRef"
      class="character purple-character"
      :style="{
        '--height': purpleHeight + 'px',
        '--skew': purpleSkew + 'deg',
        '--x': purpleX + 'px',
      }"
    >
      <div
        ref="purpleFaceRef"
        class="face purple-face"
        :style="{
          left: purpleFaceLeft + 'px',
          top: purpleFaceTop + 'px',
        }"
      >
        <EyeBall :size="18" :pupilSize="7" :maxDistance="5" />
        <EyeBall :size="18" :pupilSize="7" :maxDistance="5" />
      </div>
    </div>

    <!-- 黑色人物 - 中等高度 -->
    <div
      ref="blackRef"
      class="character black-character"
      :style="{
        '--skew': blackSkew + 'deg',
        '--x': blackX + 'px',
      }"
    >
      <div
        ref="blackFaceRef"
        class="face black-face"
        :style="{
          left: blackFaceLeft + 'px',
          top: blackFaceTop + 'px',
        }"
      >
        <EyeBall :size="16" :pupilSize="6" :maxDistance="4" />
        <EyeBall :size="16" :pupilSize="6" :maxDistance="4" />
      </div>
    </div>

    <!-- 橙色人物 - 较矮 -->
    <div
      ref="orangeRef"
      class="character orange-character"
      :style="{
        '--skew': orangeSkew + 'deg',
      }"
    >
      <div
        ref="orangeFaceRef"
        class="face orange-face"
        :style="{
          transform: `translate(${orangeFaceX}px, ${orangeFaceY}px)`,
        }"
      >
        <Pupil :size="12" :maxDistance="5" />
        <Pupil :size="12" :maxDistance="5" />
      </div>
    </div>

    <!-- 黄色人物 - 最矮 -->
    <div
      ref="yellowRef"
      class="character yellow-character"
      :style="{
        '--skew': yellowSkew + 'deg',
      }"
    >
      <div
        ref="yellowFaceRef"
        class="face yellow-face"
        :style="{
          transform: `translate(${yellowFaceX}px, ${yellowFaceY}px)`,
        }"
      >
        <Pupil :size="12" :maxDistance="5" />
        <Pupil :size="12" :maxDistance="5" />
      </div>
      <div
        ref="yellowMouthRef"
        class="mouth"
        :style="{
          transform: `translate(${mouthX}px, ${mouthY}px)`,
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import gsap from 'gsap'
import Pupil from './Pupil.vue'
import EyeBall from './EyeBall.vue'

interface Props {
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
  showConfirmPassword?: boolean
  confirmPasswordLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
  showConfirmPassword: false,
  confirmPasswordLength: 0,
})

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const purpleRef = ref<HTMLDivElement | null>(null)
const blackRef = ref<HTMLDivElement | null>(null)
const orangeRef = ref<HTMLDivElement | null>(null)
const yellowRef = ref<HTMLDivElement | null>(null)

const purpleFaceRef = ref<HTMLDivElement | null>(null)
const blackFaceRef = ref<HTMLDivElement | null>(null)
const orangeFaceRef = ref<HTMLDivElement | null>(null)
const yellowFaceRef = ref<HTMLDivElement | null>(null)
const yellowMouthRef = ref<HTMLDivElement | null>(null)

// Mouse position
const mouseRef = { x: 0, y: 0 }
let rafId = 0

// Animation states
const purpleSkew = ref(0)
const purpleX = ref(0)
const purpleHeight = ref(400)
const purpleFaceLeft = ref(45)
const purpleFaceTop = ref(40)

const blackSkew = ref(0)
const blackX = ref(0)
const blackFaceLeft = ref(26)
const blackFaceTop = ref(32)

const orangeSkew = ref(0)
const orangeFaceX = ref(0)
const orangeFaceY = ref(0)

const yellowSkew = ref(0)
const yellowFaceX = ref(0)
const yellowFaceY = ref(0)

const mouthX = ref(0)
const mouthY = ref(0)

// State refs
const isHidingPassword = ref(false)
const isShowingPassword = ref(false)
const isHidingConfirmPassword = ref(false)
const isShowingConfirmPassword = ref(false)
const isLooking = ref(false)

// Timers
let purpleBlinkTimer: ReturnType<typeof setTimeout> | undefined
let blackBlinkTimer: ReturnType<typeof setTimeout> | undefined
let purplePeekTimer: ReturnType<typeof setTimeout> | undefined
let lookingTimer: ReturnType<typeof setTimeout> | undefined

// GSAP quickTo functions
let quickTo: {
  purpleSkew: gsap.QuickToFunc
  blackSkew: gsap.QuickToFunc
  orangeSkew: gsap.QuickToFunc
  yellowSkew: gsap.QuickToFunc
  purpleX: gsap.QuickToFunc
  blackX: gsap.QuickToFunc
  purpleHeight: gsap.QuickToFunc
  purpleFaceLeft: gsap.QuickToFunc
  purpleFaceTop: gsap.QuickToFunc
  blackFaceLeft: gsap.QuickToFunc
  blackFaceTop: gsap.QuickToFunc
  orangeFaceX: gsap.QuickToFunc
  orangeFaceY: gsap.QuickToFunc
  yellowFaceX: gsap.QuickToFunc
  yellowFaceY: gsap.QuickToFunc
  mouthX: gsap.QuickToFunc
  mouthY: gsap.QuickToFunc
} | null = null

// Helper functions
const calcPos = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouseRef.x - cx
  const dy = mouseRef.y - cy
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  }
}

const calcEyePos = (el: HTMLElement, maxDist: number) => {
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const dx = mouseRef.x - cx
  const dy = mouseRef.y - cy
  const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist)
  const angle = Math.atan2(dy, dx)
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
}

const updatePupils = () => {
  if (!containerRef.value || isShowingPassword.value || isShowingConfirmPassword.value) return

  const allPupils = containerRef.value.querySelectorAll('.pupil')
  allPupils.forEach((p) => {
    const el = p as HTMLElement
    const maxDist = Number(el.dataset.maxDistance) || 5
    const ePos = calcEyePos(el, maxDist)
    gsap.set(el, { x: ePos.x, y: ePos.y })
  })

  if (!isLooking.value) {
    const allEyeballs = containerRef.value.querySelectorAll('.eyeball')
    allEyeballs.forEach((eb) => {
      const el = eb as HTMLElement
      const maxDist = Number(el.dataset.maxDistance) || 10
      const pupil = el.querySelector('.eyeball-pupil') as HTMLElement
      if (!pupil) return
      const ePos = calcEyePos(el, maxDist)
      gsap.set(pupil, { x: ePos.x, y: ePos.y })
    })
  }
}

const tick = () => {
  if (!quickTo) return

  const typing = props.isTyping
  const showing = isShowingPassword.value || isShowingConfirmPassword.value
  const hiding = isHidingPassword.value || isHidingConfirmPassword.value
  const looking = isLooking.value

  // Purple character
  if (purpleRef.value && !showing) {
    const pp = calcPos(purpleRef.value)
    if (typing || hiding) {
      quickTo.purpleSkew(pp.bodySkew - 12)
      quickTo.purpleX(40)
      quickTo.purpleHeight(440)
    } else {
      quickTo.purpleSkew(pp.bodySkew)
      quickTo.purpleX(0)
      quickTo.purpleHeight(400)
    }

    if (!looking) {
      const purpleFaceX = pp.faceX >= 0 ? Math.min(25, pp.faceX * 1.5) : pp.faceX
      quickTo.purpleFaceLeft(45 + purpleFaceX)
      quickTo.purpleFaceTop(40 + pp.faceY)
    }
  }

  // Black character
  if (blackRef.value && !showing) {
    const bp = calcPos(blackRef.value)
    if (looking) {
      quickTo.blackSkew(bp.bodySkew * 1.5 + 10)
      quickTo.blackX(20)
    } else if (typing || hiding) {
      quickTo.blackSkew(bp.bodySkew * 1.5)
      quickTo.blackX(0)
    } else {
      quickTo.blackSkew(bp.bodySkew)
      quickTo.blackX(0)
    }

    if (!looking) {
      quickTo.blackFaceLeft(26 + bp.faceX)
      quickTo.blackFaceTop(32 + bp.faceY)
    }
  }

  // Orange character
  if (orangeRef.value && !showing) {
    const op = calcPos(orangeRef.value)
    quickTo.orangeSkew(op.bodySkew)
    quickTo.orangeFaceX(op.faceX)
    quickTo.orangeFaceY(op.faceY)
  }

  // Yellow character
  if (yellowRef.value && !showing) {
    const yp = calcPos(yellowRef.value)
    quickTo.yellowSkew(yp.bodySkew)
    quickTo.yellowFaceX(yp.faceX)
    quickTo.yellowFaceY(yp.faceY)
    quickTo.mouthX(yp.faceX)
    quickTo.mouthY(yp.faceY)
  }

  updatePupils()
  rafId = requestAnimationFrame(tick)
}

const onMove = (e: MouseEvent) => {
  mouseRef.x = e.clientX
  mouseRef.y = e.clientY
}

// Blink animations
const schedulePurpleBlink = () => {
  if (!purpleRef.value) return

  const purpleEyeballs = purpleRef.value.querySelectorAll('.eyeball')
  if (!purpleEyeballs.length) return

  purpleBlinkTimer = setTimeout(() => {
    purpleEyeballs.forEach((el) => {
      gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' })
    })
    setTimeout(() => {
      purpleEyeballs.forEach((el) => {
        gsap.to(el, { height: 18, duration: 0.08, ease: 'power2.out' })
      })
      schedulePurpleBlink()
    }, 150)
  }, Math.random() * 4000 + 3000)
}

const scheduleBlackBlink = () => {
  if (!blackRef.value) return

  const blackEyeballs = blackRef.value.querySelectorAll('.eyeball')
  if (!blackEyeballs.length) return

  blackBlinkTimer = setTimeout(() => {
    blackEyeballs.forEach((el) => {
      gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' })
    })
    setTimeout(() => {
      blackEyeballs.forEach((el) => {
        gsap.to(el, { height: 16, duration: 0.08, ease: 'power2.out' })
      })
      scheduleBlackBlink()
    }, 150)
  }, Math.random() * 4000 + 3000)
}

// Look at each other animation
const applyLookAtEachOther = () => {
  if (!quickTo) return

  quickTo.purpleFaceLeft(55)
  quickTo.purpleFaceTop(65)
  quickTo.blackFaceLeft(32)
  quickTo.blackFaceTop(12)

  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 3, y: 4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 0, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
}

// Hiding password animation
const applyHidingPassword = () => {
  if (!quickTo) return
  quickTo.purpleFaceLeft(55)
  quickTo.purpleFaceTop(65)
}

// Show password animation
const applyShowPassword = () => {
  if (!quickTo) return

  quickTo.purpleSkew(0)
  quickTo.blackSkew(0)
  quickTo.orangeSkew(0)
  quickTo.yellowSkew(0)
  quickTo.purpleX(0)
  quickTo.blackX(0)
  quickTo.purpleHeight(400)

  quickTo.purpleFaceLeft(20)
  quickTo.purpleFaceTop(35)
  quickTo.blackFaceLeft(10)
  quickTo.blackFaceTop(28)
  quickTo.orangeFaceX(50 - 82)
  quickTo.orangeFaceY(85 - 90)
  quickTo.yellowFaceX(20 - 52)
  quickTo.yellowFaceY(35 - 40)
  quickTo.mouthX(10 - 40)
  quickTo.mouthY(0)

  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
  orangeRef.value?.querySelectorAll('.pupil').forEach((p) => {
    gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
  yellowRef.value?.querySelectorAll('.pupil').forEach((p) => {
    gsap.to(p, { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
}

// Schedule peek animation
const schedulePeek = () => {
  if (!purpleRef.value || (!isShowingPassword.value && !isShowingConfirmPassword.value)) return

  const purpleEyePupils = purpleRef.value.querySelectorAll('.eyeball-pupil')
  if (!purpleEyePupils.length) return

  purplePeekTimer = setTimeout(() => {
    purpleEyePupils.forEach((p) => {
      gsap.to(p, {
        x: 4,
        y: 5,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    })
    if (quickTo) {
      quickTo.purpleFaceLeft(20)
      quickTo.purpleFaceTop(35)
    }

    setTimeout(() => {
      purpleEyePupils.forEach((p) => {
        gsap.to(p, {
          x: -4,
          y: -4,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      })
      schedulePeek()
    }, 800)
  }, Math.random() * 3000 + 2000)
}

// Watch props
watch(
  () => [props.passwordLength, props.showPassword, props.confirmPasswordLength, props.showConfirmPassword],
  () => {
    const passwordActive = props.passwordLength > 0
    const confirmActive = props.confirmPasswordLength > 0

    isShowingPassword.value = passwordActive && props.showPassword
    isShowingConfirmPassword.value = confirmActive && props.showConfirmPassword

    const anyShowing = isShowingPassword.value || isShowingConfirmPassword.value
    const passwordHiding = passwordActive && !props.showPassword
    const confirmHiding = confirmActive && !props.showConfirmPassword
    const anyHiding = passwordHiding || confirmHiding

    if (anyShowing) {
      applyShowPassword()
      if (isShowingConfirmPassword.value || isShowingPassword.value) {
        schedulePeek()
      }
    } else if (anyHiding) {
      applyHidingPassword()
    }
  }
)

watch(
  () => props.isTyping,
  (typing) => {
    if (typing && !isShowingPassword.value && !isShowingConfirmPassword.value) {
      isLooking.value = true
      applyLookAtEachOther()

      clearTimeout(lookingTimer)
      lookingTimer = setTimeout(() => {
        isLooking.value = false
        purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
          gsap.killTweensOf(p)
        })
      }, 800)
    } else {
      clearTimeout(lookingTimer)
      isLooking.value = false
    }
  }
)

watch([isShowingPassword, isShowingConfirmPassword], ([showPwd, showConfirmPwd]) => {
  if ((showPwd && props.passwordLength > 0) || (showConfirmPwd && props.confirmPasswordLength > 0)) {
    schedulePeek()
  } else {
    clearTimeout(purplePeekTimer)
  }
})

// Lifecycle
onMounted(() => {
  if (!purpleRef.value || !blackRef.value || !orangeRef.value || !yellowRef.value) return
  if (!purpleFaceRef.value || !blackFaceRef.value || !orangeFaceRef.value || !yellowFaceRef.value) return
  if (!yellowMouthRef.value) return

  quickTo = {
    purpleSkew: gsap.quickTo(purpleSkew, 'value', { duration: 0.3, ease: 'power2.out' }),
    blackSkew: gsap.quickTo(blackSkew, 'value', { duration: 0.3, ease: 'power2.out' }),
    orangeSkew: gsap.quickTo(orangeSkew, 'value', { duration: 0.3, ease: 'power2.out' }),
    yellowSkew: gsap.quickTo(yellowSkew, 'value', { duration: 0.3, ease: 'power2.out' }),
    purpleX: gsap.quickTo(purpleX, 'value', { duration: 0.3, ease: 'power2.out' }),
    blackX: gsap.quickTo(blackX, 'value', { duration: 0.3, ease: 'power2.out' }),
    purpleHeight: gsap.quickTo(purpleHeight, 'value', { duration: 0.3, ease: 'power2.out' }),
    purpleFaceLeft: gsap.quickTo(purpleFaceLeft, 'value', { duration: 0.3, ease: 'power2.out' }),
    purpleFaceTop: gsap.quickTo(purpleFaceTop, 'value', { duration: 0.3, ease: 'power2.out' }),
    blackFaceLeft: gsap.quickTo(blackFaceLeft, 'value', { duration: 0.3, ease: 'power2.out' }),
    blackFaceTop: gsap.quickTo(blackFaceTop, 'value', { duration: 0.3, ease: 'power2.out' }),
    orangeFaceX: gsap.quickTo(orangeFaceX, 'value', { duration: 0.2, ease: 'power2.out' }),
    orangeFaceY: gsap.quickTo(orangeFaceY, 'value', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceX: gsap.quickTo(yellowFaceX, 'value', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceY: gsap.quickTo(yellowFaceY, 'value', { duration: 0.2, ease: 'power2.out' }),
    mouthX: gsap.quickTo(mouthX, 'value', { duration: 0.2, ease: 'power2.out' }),
    mouthY: gsap.quickTo(mouthY, 'value', { duration: 0.2, ease: 'power2.out' }),
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  rafId = requestAnimationFrame(tick)

  schedulePurpleBlink()
  scheduleBlackBlink()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  cancelAnimationFrame(rafId)
  clearTimeout(purpleBlinkTimer)
  clearTimeout(blackBlinkTimer)
  clearTimeout(purplePeekTimer)
  clearTimeout(lookingTimer)
})
</script>

<style scoped>
.animated-characters {
  position: relative;
  width: 550px;
  height: 400px;
}

.character {
  position: absolute;
  bottom: 0;
  transform-origin: bottom center;
  will-change: transform;
}

/* Purple character - tallest */
.purple-character {
  left: 70px;
  width: 180px;
  height: var(--height, 400px);
  background-color: #6c3ff5;
  border-radius: 10px 10px 0 0;
  z-index: 1;
  transform: skewX(var(--skew, 0deg)) translateX(var(--x, 0px));
}

/* Black character - medium */
.black-character {
  left: 240px;
  width: 120px;
  height: 310px;
  background-color: #2d2d2d;
  border-radius: 8px 8px 0 0;
  z-index: 2;
  transform: skewX(var(--skew, 0deg)) translateX(var(--x, 0px));
}

/* Orange character - shorter */
.orange-character {
  left: 0;
  width: 240px;
  height: 200px;
  background-color: #ff9b6b;
  border-radius: 120px 120px 0 0;
  z-index: 3;
  transform: skewX(var(--skew, 0deg));
}

/* Yellow character - shortest */
.yellow-character {
  left: 310px;
  width: 140px;
  height: 230px;
  background-color: #e8d754;
  border-radius: 70px 70px 0 0;
  z-index: 4;
  transform: skewX(var(--skew, 0deg));
}

.face {
  position: absolute;
  display: flex;
  gap: 32px;
}

.purple-face {
  gap: 32px;
}

.black-face {
  gap: 24px;
}

.orange-face {
  left: 82px;
  top: 90px;
}

.yellow-face {
  left: 52px;
  top: 40px;
  gap: 24px;
}

.mouth {
  position: absolute;
  width: 80px;
  height: 4px;
  background-color: #2d2d2d;
  border-radius: 9999px;
  left: 40px;
  top: 88px;
}
</style>