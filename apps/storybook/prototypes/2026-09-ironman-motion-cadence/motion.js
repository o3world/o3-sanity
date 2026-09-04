/* Frozen review instrument. No production imports, persistence, or scroll interpolation. */
const params = new URLSearchParams(location.search)
const preference = matchMedia('(prefers-reduced-motion: reduce)')
const mode = document.querySelector('#motion-mode')
mode.value =
  params.get('motion') === 'reduce'
    ? 'reduce'
    : params.get('motion') === 'still'
      ? 'still'
      : 'native'
const scenes = [...document.querySelectorAll('[data-scene]')]
const beats = [...document.querySelectorAll('[data-beat]')]
const pending = new Set()
let observer
let frame = 0
let previousY = scrollY
let interruption = 'none'
let started = 0
const output = document.querySelector('#motion-state')
const passive = { passive: true }

function members(scene) {
  return beats.filter(
    (beat) => beat === scene || scene.contains(beat) || beat.dataset.sceneOwner === scene.id,
  )
}
function disabled() {
  return mode.value !== 'native' || preference.matches
}
function describe() {
  output.textContent = `${disabled() ? 'Still' : 'Native'} · ${pending.size} pending · ${beats.filter((beat) => beat.dataset.motionState === 'entering').length} entering · ${started} entrances · ${beats.filter((beat) => beat.dataset.motionState === 'settled').length} settled · interruption: ${interruption}`
  document.querySelector('#scene-state').textContent = scenes
    .map(
      (scene) =>
        `${scene.dataset.scene}: ${members(scene)
          .map((beat) => `${beat.dataset.beat} ${beat.dataset.motionState}`)
          .join(', ')}`,
    )
    .join('\n')
  if (!pending.size && !beats.some((beat) => beat.dataset.motionState === 'entering')) {
    removeEventListener('scroll', onScroll)
  }
}
function settle(beat) {
  beat.dataset.motionState = 'settled'
}
function settleScene(scene) {
  members(scene).forEach(settle)
  pending.delete(scene)
  observer?.unobserve(scene)
}
function settleAll(reason) {
  interruption = reason
  observer?.disconnect()
  cancelAnimationFrame(frame)
  frame = 0
  pending.clear()
  beats.forEach(settle)
  describe()
}
function enter(scene) {
  const local = members(scene)
  const bounds = scene.getBoundingClientRect()
  // A restored/jumped-past scene is content, not an entrance to play late.
  if (bounds.bottom <= 0 || bounds.top < -innerHeight || disabled()) {
    settleScene(scene)
  } else {
    local.forEach((beat) => {
      beat.dataset.motionState = 'entering'
      started += 1
    })
    pending.delete(scene)
    observer.unobserve(scene)
  }
  describe()
}
function inspectScroll() {
  frame = 0
  const distance = Math.abs(scrollY - previousY)
  const fast = distance > innerHeight * 0.65
  previousY = scrollY
  if (fast) {
    interruption = 'rapid scroll'
    for (const beat of beats) {
      if (beat.dataset.motionState === 'entering') settle(beat)
    }
  }
  for (const scene of pending) {
    if (scene.getBoundingClientRect().top < innerHeight * 0.9) {
      if (fast || scene.getBoundingClientRect().bottom < 0) settleScene(scene)
      else enter(scene)
    }
  }
  describe()
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(inspectScroll)
}
function arm() {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  frame = 0
  pending.clear()
  started = 0
  interruption = 'none'
  previousY = scrollY
  document.documentElement.dataset.motion = mode.value
  addEventListener('scroll', onScroll, passive)
  if (!('IntersectionObserver' in window)) {
    settleAll('observer unavailable')
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting && pending.has(entry.target)) enter(entry.target)
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  )
  for (const scene of scenes) {
    if (disabled() || scene.getBoundingClientRect().top < innerHeight) {
      settleScene(scene)
      continue
    }
    members(scene).forEach((beat) => {
      beat.dataset.motionState = 'armed'
    })
    pending.add(scene)
    observer.observe(scene)
  }
  describe()
}

document.addEventListener('animationend', (event) => {
  if (event.animationName === 'cadence-enter' && event.target.matches('[data-beat]')) {
    settle(event.target)
    describe()
  }
})
document.addEventListener('focusin', (event) => {
  const scene = event.target.closest('[data-scene]')
  if (scene) {
    settleScene(scene)
    describe()
  }
})
addEventListener('resize', () => settleAll('resize'), passive)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) settleAll('hidden tab')
})
addEventListener('pagehide', () => settleAll('pagehide'))
preference.addEventListener('change', () => settleAll('system preference'))
mode.addEventListener('change', () => {
  const url = new URL(location.href)
  url.searchParams.set('motion', mode.value)
  history.replaceState(null, '', url)
  arm()
})
document.querySelector('#replay').addEventListener('click', () => {
  scrollTo({ top: 0, behavior: 'instant' })
  arm()
})
for (const button of document.querySelectorAll('[data-jump]')) {
  button.addEventListener('click', () => {
    const scene = document.getElementById(button.dataset.jump)
    scrollTo({
      top: scene.getBoundingClientRect().top + scrollY - innerHeight * 0.8,
      behavior: 'instant',
    })
    previousY = scrollY
  })
}
function rapid() {
  scrollTo({ top: 0, behavior: 'instant' })
  arm()
  // Deliberately jump over the observed boundaries, then return. Review action only.
  requestAnimationFrame(() => {
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    requestAnimationFrame(() => {
      inspectScroll()
      scrollTo({ top: 0, behavior: 'instant' })
      document.querySelector('#rapid-result').textContent =
        pending.size === 0
          ? 'Rapid-scroll result: every skipped scene is settled. Scroll down to inspect.'
          : 'Rapid-scroll result: pending scenes remain — inspect before accepting.'
    })
  })
}
document.querySelector('#rapid').addEventListener('click', rapid)
arm()
if (params.get('autotest') === 'rapid') rapid()
