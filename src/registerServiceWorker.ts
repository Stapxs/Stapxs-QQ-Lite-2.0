/* eslint-disable no-console */

import { register } from 'register-service-worker'
import { PopInfo, PopType, Logger } from './function/base'
import app from './main'

const popInfo = new PopInfo()
const logger = new Logger()

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      logger.debug(app.config.globalProperties.$t('sw_ready'))
    },
    registered () {
      logger.debug(app.config.globalProperties.$t('sw_registered'))
    },
    cached () {
      console.log(app.config.globalProperties.$t('sw_cached'))
    },
    updatefound () {
      console.log(app.config.globalProperties.$t('sw_update'))
    },
    updated () {
      console.log(app.config.globalProperties.$t('sw_updated'))
    },
    offline () {
      console.log(app.config.globalProperties.$t('sw_offline'))
      popInfo.add(PopType.INFO, app.config.globalProperties.app.config.globalProperties.$t('sw_no_internet'))
    },
    error (error) {
      console.error(app.config.globalProperties.$t('sw_error') + ': ', error)
    }
  })
}
