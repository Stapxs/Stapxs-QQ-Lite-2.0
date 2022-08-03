/*
 * @FileDescription: 基础功能模块
 * @Author: Stapxs
 * @Date: 2022/08/01
 * @Version: 1.0
*/

import Vue from 'vue'

// 初始化信息
export function loadBaseInfo () {
  // // Bot 信息
  // Vue.sendWs(Vue.createAPI(
  //   'get_version_info',
  //   null, null
  // ))
  // // 用户信息
  // Vue.sendWs(Vue.createAPI(
  //   'get_login_info',
  //   null, null
  // ))
  // // 通用凭证
  // Vue.sendWs(Vue.createAPI(
  //   'get_csrf_token',
  //   null, null
  // ))
  // 好友列表
  Vue.sendWs(Vue.createAPI(
    'get_friend_list',
    null, null
  ))
  // 群列表
  Vue.sendWs(Vue.createAPI(
    'get_group_list',
    null, null
  ))
}

export default {
  loadBaseInfo
}
