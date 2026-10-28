import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faComments,
  faMessage,
  faShieldHalved,
  faShieldHeart,
  faLock,
  faEnvelope,
  faKey,
  faCircleExclamation,
  faSpinner,
  faMoon,
  faSun,
  faCircleInfo,
  faArrowRightFromBracket,
  faUserGroup,
  faUsers,
  faCircleCheck,
  faCheck,
  faClock,
  faXmark,
  faDoorClosed,
} from '@fortawesome/free-solid-svg-icons'

import App from './App.vue'
import './styles/index.css'

library.add(
  faComments,
  faMessage,
  faShieldHalved,
  faShieldHeart,
  faLock,
  faEnvelope,
  faKey,
  faCircleExclamation,
  faSpinner,
  faMoon,
  faSun,
  faCircleInfo,
  faArrowRightFromBracket,
  faUserGroup,
  faUsers,
  faCircleCheck,
  faCheck,
  faClock,
  faXmark,
  faDoorClosed,
)

const app = createApp(App)

app.use(createPinia())
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')
