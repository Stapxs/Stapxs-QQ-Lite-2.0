import { setBcuiTheme, type BcuiTheme } from 'vue3-bcui'

const LOCAL_BCUI_STYLE_ID = 'ssqq-local-bcui-style'
const LOCAL_BCUI_THEME_ID = 'ssqq-local-bcui-theme'
const LOCAL_APPEND_THEME_ID = 'ssqq-local-append-theme'

function upsertStyleLink(id: string, href: string) {
    const head = document.head
    if (!head) {
        return
    }

    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
        link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.type = 'text/css'
    }

    if (link.href !== new URL(href, window.location.origin).href) {
        link.href = href
    }

    if (!link.isConnected) {
        head.appendChild(link)
    }
}

export function applyBcuiTheme(theme: BcuiTheme) {
    setBcuiTheme(theme)
    upsertStyleLink(LOCAL_BCUI_STYLE_ID, '/bcui/css/style.css')
    upsertStyleLink(LOCAL_BCUI_THEME_ID, `/bcui/css/color-${theme}.css`)
    upsertStyleLink(LOCAL_APPEND_THEME_ID, `/css/append-${theme}.css`)
}
