import { ref, onMounted, onUnmounted, computed } from 'vue'

const breakpoints = {
  XL: 1920, // 超大屏
  LG: 1440, // 大屏
  MD: 1024, // 中屏/平板竖屏
  SM: 768   // 小屏/手机横屏
}

export type ScreenSize = 'XL' | 'SM' | 'MD' | 'LG'

export function useResponsive() {
  const screen = ref<ScreenSize>('MD')

  const checkScreen = () => {
    const width = window.innerWidth
    if (width >= breakpoints.XL) {
      screen.value = 'XL'
    } else if (width >= breakpoints.LG) {
      screen.value = 'LG'
    } else if (width >= breakpoints.MD) {
      screen.value = 'MD'
    } else {
      screen.value = 'SM'
    }
  }

  onMounted(() => {
    checkScreen()
    window.addEventListener('resize', checkScreen)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkScreen)
  })

  return {
    screen,
    isXL: computed(() => screen.value === 'XL'),
    isLG: computed(() => screen.value === 'LG'),
    isMD: computed(() => screen.value === 'MD'),
    isSM: computed(() => screen.value === 'SM'),
    isMobile: computed(() => screen.value === 'SM' || screen.value === 'MD'),
    isDesktop: computed(() => screen.value === 'LG' || screen.value === 'XL')
  }
}
