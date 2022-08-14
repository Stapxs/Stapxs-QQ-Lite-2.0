/*
 * @FileDescription: 页面交互模块
 * @Author: Stapxs
 * @Date: 2022/08/01
 * @Version: 1.0
*/

export function waveAnimation (wave) {
  let waves = wave.children[1].children
  let min = 20
  let max = 195
  let add = 1
  let timer = setInterval(() => {
    // 遍历波浪体
    for (var i = 0; i < waves.length; i++) {
      let now = waves[i].getAttribute('x')
      if (Number(now) + add > max) {
        waves[i].setAttribute('x', min)
      } else {
        waves[i].setAttribute('x', Number(now) + add)
      }
    }
  }, 50)
  return timer
}

export default {
  waveAnimation
}
