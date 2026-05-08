/**
 * useAnimation - Hook personnalisé pour gérer les animations
 * 
 * Usage:
 * const { ref, isVisible, animate } = useAnimation({
 *   threshold: 0.1,
 *   triggerOnce: true
 * })
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false
} = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (triggerOnce && hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce, hasTriggered])

  return { ref, isIntersecting }
}

export function useAnimation({
  animationClass = 't360-animate-fade-in-up',
  threshold = 0.1,
  triggerOnce = true,
  delay = 0
} = {}) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce
  })

  useEffect(() => {
    if (isIntersecting && !isAnimated) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        setIsAnimated(true)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [isIntersecting, isAnimated, delay])

  const animate = useCallback(() => {
    setIsVisible(true)
  }, [])

  const reset = useCallback(() => {
    setIsVisible(false)
    setIsAnimated(false)
  }, [])

  // Merge refs
  const setRefs = useCallback((node) => {
    ref.current = node
    intersectionRef.current = node
  }, [intersectionRef])

  return {
    ref: setRefs,
    isVisible,
    isAnimated,
    animate,
    reset,
    className: isVisible ? animationClass : ''
  }
}

export function useStaggerAnimation(itemCount, {
  baseDelay = 100,
  animationClass = 't360-animate-fade-in-up'
} = {}) {
  const [visibleItems, setVisibleItems] = useState(new Set())

  const showItem = useCallback((index) => {
    setTimeout(() => {
      setVisibleItems(prev => new Set([...prev, index]))
    }, index * baseDelay)
  }, [baseDelay])

  const reset = useCallback(() => {
    setVisibleItems(new Set())
  }, [])

  const getItemClass = useCallback((index) => {
    return visibleItems.has(index) ? animationClass : 'opacity-0'
  }, [visibleItems, animationClass])

  return { showItem, reset, getItemClass, visibleItems }
}

export function useCountUp({
  end,
  duration = 1000,
  start = 0,
  decimals = 0
} = {}) {
  const [value, setValue] = useState(start)
  const [isComplete, setIsComplete] = useState(false)

  const startAnimation = useCallback(() => {
    setIsComplete(false)
    const startTime = performance.now()
    const startValue = value

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (end - startValue) * easeOut
      
      setValue(Number(current.toFixed(decimals)))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsComplete(true)
      }
    }

    requestAnimationFrame(animate)
    // `start` is only consumed by useState initialization, not inside the
    // callback body — it does not belong here.
  }, [end, duration, decimals, value])

  return { value, isComplete, startAnimation }
}

export function useHover() {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => setIsHovered(false)

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return { ref, isHovered }
}

export function usePulse({
  interval = 2000,
  duration = 500
} = {}) {
  const [isPulsing, setIsPulsing] = useState(false)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), duration)
    }, interval)

    return () => clearInterval(intervalId)
  }, [interval, duration])

  return { isPulsing }
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0
      setProgress(Math.min(scrollProgress, 1))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

export default useAnimation
