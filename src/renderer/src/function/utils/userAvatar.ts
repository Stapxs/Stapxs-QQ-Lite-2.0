import { icon } from '@fortawesome/fontawesome-svg-core'
import {
    faDesktop,
    faMobileScreenButton,
    faTabletScreenButton,
} from '@fortawesome/free-solid-svg-icons'

interface AvatarPathMap {
    name?: string
    device_contacts?: Record<string, string>
}

const deviceAvatars = {
    computer: faDesktop,
    phone: faMobileScreenButton,
    tablet: faTabletScreenButton,
}

const deviceImages = Object.fromEntries(
    Object.entries(deviceAvatars).map(([kind, definition]) => [
        kind,
        'data:image/svg+xml,' + encodeURIComponent(
            icon(definition, { styles: { color: '#7f91de' } }).html.join(''),
        ),
    ]),
)

/** Device peers use protocol IDs, not QQ account numbers accepted by qlogo. */
export function getUserAvatar(userId: number | string, pathMap?: AvatarPathMap) {
    const device = pathMap?.name === 'SnowLuma'? pathMap.device_contacts?.[String(userId)]: undefined
    if (device) {
        return Object.hasOwn(deviceImages, device)? deviceImages[device]: deviceImages.computer
    }
    return 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + userId
}
