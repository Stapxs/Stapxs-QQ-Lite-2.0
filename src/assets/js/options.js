/*
 * @FileDescription: 设置功能模块
 * @Author: Stapxs
 * @Date: 2022/09/27
 * @Version: 1.0
*/

import Vue from 'vue'

const configFunction = {
  language: setLanguage,
  opt_dark: setDarkMode,
  opt_auto_dark: setAutoDark,
  theme_color: changeTheme
}

const selectDefault = {
  language: 'zh-CN',
  log_level: 'err'
}

// ======================= 设置项功能 ============================

function setLanguage (name) {
  import(`../src/l10n/${name}.json`).then(lang => {
    Vue.$i18n.setLocaleMessage(name, lang)
  })
  Vue.$i18n.locale = name
}

function setDarkMode (value) {
  if (Vue.configs.opt_auto_dark === 'null' || !Vue.configs.opt_auto_dark) {
    if (value === true || value === 'true') {
      window.changeColor('dark')
    } else {
      window.changeColor('light')
    }
  }
}
function setAutoDark (value) {
  window.is_auto_dark = value
}
function changeTheme (id) {
  document.documentElement.style.setProperty('--color-main', 'var(--color-main-' + id + ')')
}

// ======================= 设置主功能 ============================

// 读取存储在 cookie 的设置项
function load () {
  let options = {}
  const str = Vue.$cookies.get('options')
  if (str != null) {
    const list = str.split('&')
    for (let i = 0; i < list.length; i++) {
      const opt = list[i].split(':')
      if (opt.length === 2) {
        // 特殊处理被字符串化的布尔值
        if (opt[1] === 'true' || opt[1] === 'false') {
          opt[1] = opt[1] === 'true'
        }
        options[opt[0]] = opt[1]
        // 执行
        run(opt[0], opt[1])
      }
    }
  }
  // 初始化不存在的下拉框值
  Object.keys(selectDefault).forEach((key) => {
    if (options[key] === undefined) {
      options[key] = selectDefault[key]
    }
  })
  // 保存返回
  Vue.configs = options
  console.log(Vue.configs)
  return options
}

// 保存配置
function save (name, value) {
  Vue.configs[name] = value
  saveAll()
}
function saveAll () {
  let str = ''
  Object.keys(Vue.configs).forEach(key => {
    str += key + ':' + Vue.configs[key] + '&'
  })
  str = str.substring(0, str.length - 1)
  Vue.$cookies.set('options', str, '1m')
}

// 触发配置
function run (name, value) {
  const fun = configFunction[name]
  if (typeof fun === 'function') {
    fun(value)
  }
}
// 保存并触发配置
function runAS (name, value) {
  save(name, value)
  run(name, value)
}

// 通过触发事件保存并触发配置
export function runASWEvent (event) {
  console.log(event)
  const sender = event.path[0]
  const type = sender.nodeName
  const name = sender.name
  let value = null
  switch (type) {
    case 'SELECT': {
      value = sender.options[sender.selectedIndex].value
      break
    }
    case 'INPUT': {
      switch (sender.type) {
        case 'checkbox': {
          value = sender.checked
          break
        }
        case 'radio': {
          value = sender.dataset.id
          break
        }
      }
      break
    }
  }
  console.log(type)
  console.log(name + ': ' + value)
  runAS(name, value)
}

// 获取设置项
export function get (name) {
  Object.keys(Vue.configs).forEach((item) => {
    if (item === name) {
      return Vue.configs[item]
    }
  })
}

export default {
  load,
  save,
  run,
  runAS,
  get
}
