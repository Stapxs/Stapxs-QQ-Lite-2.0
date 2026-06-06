<!--
 * @FileDescription: 首次使用的欢迎面板
 * @Author: Stapxs
 * @Date: 2023-01-18
 * @Version: 1.0
-->
 <!-- eslint-disable max-len -->

<template>
    <div v-if="show != 'home'" class="step-line">
        <font-awesome-icon :class="show == 'home' ? 'select' : ''" :icon="['fas', 'earth-asia']" @click="changeView('home')" /><div />
        <font-awesome-icon :class="show == 'license' ? 'select' : ''" :icon="['fas', 'pen-nib']" @click="changeView('license')" /><div />
        <font-awesome-icon :class="show.startsWith('function') ? 'select' : ''" :icon="['fas', 'brush']" @click="changeView('function')" /><div />
        <font-awesome-icon :class="show.startsWith('tip') ? 'select' : ''" :icon="['fas', 'book']" @click="changeView('tip')" /><div />
        <font-awesome-icon :class="show.startsWith('info') ? 'select' : ''" :icon="['fas', 'circle-info']" @click="changeView('info')" /><div />
        <font-awesome-icon :class="show == 'end' ? 'select' : ''" :icon="['fas', 'circle-check']" @click="changeView('end')" />
    </div>
    <div v-if="show == 'home'" class="wel-home">
        <img src="/img/icons/icon.svg">
        <span>WELCOME</span>
        <div>
            <span>{{ $t('Stapxs QQ Lite') }}</span>
            <a>2.0</a>
        </div>
        <hr>
        <div class="l10n-info" style="width: calc(100% - 40px)">
            <font-awesome-icon style="margin-right: 30px" :icon="['fas', 'language']" />
            <div style="overflow: hidden">
                <div class="select-wrapper">
                    <select v-model="settingsStore.sysConfig.language"
                        name="language"
                        title="language"
                        @change="save($event);gaLanguage($event)">
                        <option v-for="item in languages"
                            :key="item.value"
                            :value="item.value">
                            {{ item.name }}
                        </option>
                    </select>
                </div>
                <span class="author">{{ $t('作者：') }}{{ $t('Stapx Steve') }}</span>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('license')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-if="show == 'license'" class="base-box">
        <div class="lead">
            <span>{{ $t('欢迎使用 Stapxs QQ Lite') }}</span>
            <div />
            <div>
                <span>{{ $t('在开始之前，请阅读以下条款：') }}</span>
                <a @click="openLink(`https://github.com/${repoName}/blob/next/DISCLAIMER.md`)">Stapxs QQ Lite 免责条款（简体中文）</a>
                <a @click="openLink(`https://github.com/${repoName}/blob/next/LICENSE`)">Stapxs QQ Lite 开源许可（英文）</a>
                <br>
                <span>{{ $t('并酌情阅读以下文档：') }}</span>
                <a @click="openLink('https://www.chiark.greenend.org.uk/~sgtatham/bugs-cn.html')">《如何有效地报告 BUG》</a>
                <a @click="openLink('https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md')">《提问的智慧》</a>
            </div>
            <span>{{ $t('点击继续则默许已阅读并同意以上条款内容') }}</span>
        </div>
        <button class="ss-button wel-next" @click="setPage('function')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-else-if="show == 'function'" class="function">
        <div class="config">
            <div>
                <div class="theme_color">
                    <div><div /><div><div /><div /></div></div>
                    <div class="me">
                        <div /><div><div /><div /></div>
                    </div>
                    <div><div /><div><div /><div /></div></div>
                </div>
            </div>
            <div>
                <span>{{ $t('外观') }}</span>
                <a>{{ $t('Stapxs QQ Lite 拥有一个主题色，你可以选择一个主题色作为主要风格！如果你喜欢保持深色主题，也可以关闭自动深色模式自行选择。') }}</a>
                <div v-if="!napcat" class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('主题色') }}</span>
                        <span>{{ $t('换个心情 🎵 ~') }}</span>
                    </div>
                    <div class="theme-color-col">
                        <label v-for="(name, index) in colors" :key="'color_id_' + index"
                            :title="name" class="ss-radio">
                            <input type="radio" name="theme_color" :data-id="index"
                                :checked="settingsStore.sysConfig.theme_color === undefined ?
                                    index === 0 : Number(settingsStore.sysConfig.theme_color) === index"
                                @change="save($event)">
                            <div
                                :style="{ 'background': `var(--color-main-${index})` }">
                                <div />
                            </div>
                        </label>
                    </div>
                </div>
                <div v-if="!settingsStore.sysConfig.opt_auto_dark" id="opt_view_dark" class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('深色模式') }}</span>
                        <span>{{ $t('是五彩斑斓的黑色！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="settingsStore.sysConfig.opt_dark"
                            type="checkbox" name="opt_dark" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <div class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('自动深色模式') }}</span>
                        <span>{{ $t('Biubiu ——，自动变黑！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="settingsStore.sysConfig.opt_auto_dark"
                            type="checkbox" name="opt_auto_dark" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('function_msg')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-else-if="show == 'function_msg'" class="function">
        <div class="config">
            <div>
                <div class="bubble_sort_user">
                    <div>
                        <div><font-awesome-icon style="margin-right: 5px;" :icon="['fas', 'user-group']" /></div>
                        <div><div>{{ $t('群收纳盒') }}</div><div /></div>
                    </div>
                    <div><div /><div><div /><div /></div></div>
                    <div><div /><div><div /><div /></div></div>
                </div>
            </div>
            <div>
                <span>{{ $t('群收纳盒') }}</span>
                <a>{{ $t('群收纳盒将所有的群消息收进一个单独的群消息列表内并提供实时置顶新消息的功能；会话显示和群通知方式可以单独设置。') }}</a>
                <div class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('群收纳盒') }}</span>
                        <span>{{ $t('全都放出来！全都放出来！') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="settingsStore.sysConfig.bubble_sort_user"
                            type="checkbox" name="bubble_sort_user" @change="save">
                        <div>
                            <div />
                        </div>
                    </label>
                </div>
                <div class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('会话显示') }}</span>
                        <span>{{ $t('控制消息页显示最近会话还是全部会话') }}</span>
                    </div>
                    <div class="select-wrapper">
                        <select v-model="settingsStore.sysConfig.session_display_mode" style="width: 100%;"
                            name="session_display_mode" title="session_display_mode" @change="save">
                            <option value="recent">
                                {{ $t('仅显示最近有消息的会话') }}
                            </option>
                            <option value="all">
                                {{ $t('显示全部会话') }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="opt-item wel-opt-item">
                    <div>
                        <span>{{ $t('群消息通知方式') }}</span>
                        <span>{{ $t('重要消息将始终发起应用内通知和系统通知') }}</span>
                    </div>
                    <div class="select-wrapper">
                        <select v-model="settingsStore.sysConfig.group_notice_type" style="width: 100%;"
                            name="group_notice_type" title="group_notice_type" @change="save">
                            <option value="none">
                                {{ $t('不通知（默认）') }}
                            </option>
                            <option value="inner">
                                {{ $t('仅应用内通知') }}
                            </option>
                            <option value="all">
                                {{ $t('应用内通知和系统通知') }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('tip')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-else-if="show == 'tip'" class="function">
        <div class="config">
            <div>
                <div class="theme_color menu">
                    <div><div /><div><div /><div /></div></div>
                    <a><div>
                        <div><div /><div /></div>
                        <div class="select">
                            <font-awesome-icon :icon="['fas', 'reply']" />
                            <span>{{ $t('回复') }}</span>
                        </div>
                        <div><div /><div /></div>
                        <div><div /><div /></div>
                        <div><div /><div /></div>
                    </div></a>
                </div>
            </div>
            <div>
                <span>{{ $t('更多菜单') }}</span>
                <a>{{ $t('Stapxs QQ Lite 的部分功能包含在元素的菜单中。你可以右击（或长按）消息列表、头像、消息等元素展开菜单来使用更多功能！') }}</a>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('tip_input')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-else-if="show == 'tip_input'" class="function">
        <div class="config">
            <div>
                <div class="input_bar">
                    <div>
                        <div><div /><div /></div>
                        <div class="select">
                            <div /><div>{{ $t('林小槐') }}</div>
                        </div>
                        <div><div /><div /></div>
                        <div><div /><div /></div>
                        <div><div /><div /></div>
                    </div>
                    <div><div /><div>{{ $t('[SQ:0] 你看看这个 @林') }}</div></div>
                </div>
            </div>
            <div>
                <span>{{ $t('输入框功能') }}</span>
                <a>{{ $t('消息发送框除了输入内容以外，同时支持粘贴图片、at 群成员功能；不过不支持富媒体显示和多行输入。') }}</a>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('info')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-if="show == 'info'" class="base-box">
        <div class="lead">
            <span>{{ $t('统计选项') }}</span>
            <div />
            <div>
                <span>{{ $t('Stapxs QQ Lite 会将部分使用数据上传到自建的 umami 服务器中用于了解用户使用情况以及制作一些有趣的统计信息。') }}</span>
                <span style="margin-bottom: 20px;">{{ $t('如果你并不希望上传这些数据，可以选择关闭它。') }}</span>
                <div class="opt-item wel-opt-item"
                    :style="{ 'background': settingsStore.sysConfig.close_ga !== true ? 'var(--color-card-1)' : 'none' }">
                    <font-awesome-icon :icon="['fas', 'cloud']" />
                    <div>
                        <span>{{ $t('关闭分析') }}</span>
                        <span>{{ $t('真的不让看吗（小声') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input v-model="settingsStore.sysConfig.close_ga" type="checkbox"
                            name="close_ga" @change="save">
                        <div style="background: var(--color-card-2)">
                            <div />
                        </div>
                    </label>
                </div>
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('info_free')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-if="show == 'info_free'" class="base-box">
        <div class="lead">
            <span>{{ $t('开源提醒') }}</span>
            <div />
            <div style="align-items: flex-end;">
                <span>{{ $t('Stapxs QQ Lite 是一个开源免费的软件，这意味着没有任何激活、使用限制等付费功能；') }}</span>
                <span style="margin-bottom: 20px;">{{ $t('如果你通过任何付费方式获取了 Stapxs QQ Lite，请及时追回损失并酌情反馈。') }}</span>

                <span>{{ $t('Stapxs QQ Lite 仅在 GitHub 上发布。由于提供了自行部署的方式，非官方版本请谨慎使用。') }}</span>
                <font-awesome-icon style="width:15vh;height:15vh;margin-top:-15vh;opacity:0.1;color:var(--color-font);"
                    :icon="['fas', 'triangle-exclamation']" />
            </div>
        </div>
        <button class="ss-button wel-next" @click="setPage('end')">
            {{ $t('继续') }}
        </button>
    </div>
    <div v-else-if="show == 'end'" class="wel-end">
        <svg id="Layer_1"
            height="60px"
            width="60px"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 448.019 448.019"
            xml:space="preserve">
            <g transform="translate(0 -1020.36)">
                <g shape-rendering="auto"
                    image-rendering="auto"
                    color-rendering="auto"
                    color-interpolation="sRGB">
                    <path style="fill: var(--color-font-1)" d="M254.087,1160.22c-2.724-0.061-5.291,1.271-6.813,3.531l-12.813,18.969l-18.469-19.938c-3.013-3.232-8.076-3.408-11.308-0.395c-1.827,1.703-2.753,4.162-2.505,6.646l2.376,22.781l-26.938-3.406c-4.384-0.553-8.386,2.555-8.937,6.939c-0.314,2.498,0.565,4.998,2.374,6.748l16.469,15.938l-22.843,14.719c-3.706,2.406-4.759,7.361-2.352,11.068c1.358,2.09,3.614,3.43,6.101,3.619l22.875,1.623l-8.062,25.969c-1.286,4.227,1.099,8.697,5.327,9.982c2.394,0.729,4.99,0.295,7.017-1.172l18.531-13.438l10.531,25.063c1.728,4.066,6.425,5.963,10.492,4.236c2.308-0.98,4.023-2.986,4.633-5.42l5.563-22.219l24.187,12.438c3.932,2.018,8.754,0.465,10.77-3.467c1.15-2.242,1.177-4.895,0.073-7.158l-10.03-20.594l26.499-6c4.311-0.971,7.018-5.252,6.047-9.563c-0.557-2.475-2.255-4.539-4.575-5.563l-20.906-9.314l16.437-21.656c2.677-3.516,1.997-8.535-1.519-11.213c-2.016-1.535-4.641-2.023-7.075-1.318l-22,6.314l-1.344-27.156c-0.211-4.176-3.602-7.484-7.781-7.594L254.087,1160.22z" />
                    <path style="fill: var(--color-font-2)" d="M220.586,1191.282l9,9.719c3.007,3.238,8.069,3.426,11.307,0.42c0.45-0.418,0.851-0.887,1.194-1.396l5-7.438l0.656,13.219c0.211,4.414,3.959,7.82,8.373,7.611c0.614-0.029,1.223-0.131,1.814-0.299l8.626-2.469l-8,10.531c-2.674,3.518-1.991,8.537,1.526,11.211c0.494,0.377,1.031,0.693,1.599,0.945l8.187,3.656l-12.907,2.938c-4.309,0.977-7.011,5.262-6.035,9.57c0.134,0.592,0.334,1.166,0.598,1.711l3.938,8.094l-11.781-6.063c-3.932-2.016-8.754-0.463-10.77,3.469c-0.275,0.537-0.489,1.104-0.637,1.688l-2.187,8.719l-5.126-12.219c-1.716-4.072-6.408-5.982-10.48-4.266c-0.56,0.236-1.09,0.535-1.582,0.891l-7.25,5.25l3.907-12.623c1.304-4.223-1.061-8.701-5.282-10.006c-0.589-0.182-1.197-0.295-1.812-0.338l-8.97-0.623l11.157-7.188c3.71-2.4,4.772-7.354,2.371-11.064c-0.33-0.51-0.718-0.98-1.155-1.404l-6.437-6.219l13.125,1.658c4.383,0.559,8.39-2.541,8.949-6.924c0.079-0.617,0.085-1.24,0.019-1.859L220.586,1191.282z" />
                    <path style="fill: var(--color-font-1)" d="M231.891,1044.45c-4.418,0.068-7.944,3.707-7.875,8.125l0,0v79.813c-0.062,4.418,3.469,8.051,7.887,8.113c4.418,0.063,8.051-3.469,8.113-7.887c0.001-0.076,0.001-0.15,0-0.227v-79.813c0.069-4.418-3.456-8.056-7.875-8.125C232.058,1044.449,231.975,1044.449,231.891,1044.45z" />
                </g>
                <g>
                    <path style="fill: var(--color-font-1)" d="M224.019,1156.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S224.019,1151.95,224.019,1156.368z" />
                    <path style="fill: var(--color-font-1)" d="M176.019,1172.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S176.019,1167.95,176.019,1172.368z" />
                    <path style="fill: var(--color-font-1)" d="M152.019,1220.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S152.019,1215.95,152.019,1220.368z" />
                    <path style="fill: var(--color-font-1)" d="M160.019,1268.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S160.019,1263.95,160.019,1268.368z" />
                    <path style="fill: var(--color-font-1)" d="M200.019,1300.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S200.019,1295.95,200.019,1300.368z" />
                    <path style="fill: var(--color-font-1)" d="M256.019,1300.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S256.019,1295.95,256.019,1300.368z" />
                    <path style="fill: var(--color-font-1)" d="M288.019,1268.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S288.019,1263.95,288.019,1268.368z" />
                    <path style="fill: var(--color-font-1)" d="M296.019,1212.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S296.019,1207.95,296.019,1212.368z" />
                    <path style="fill: var(--color-font-1)" d="M272.019,1172.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S272.019,1167.95,272.019,1172.368z" />
                    <g shape-rendering="auto" image-rendering="auto" color-rendering="auto"
                        color-interpolation="sRGB">
                        <g>
                            <path style="fill: var(--color-font-1)" d="M103.734,1068.388c-4.417,0.137-7.886,3.828-7.749,8.244c0.076,2.453,1.274,4.736,3.25,6.193c27.302,20.898,41.291,44.17,53.531,69c1.959,3.961,6.758,5.584,10.719,3.625s5.584-6.758,3.625-10.719c-12.643-25.648-28.357-51.818-58.157-74.625C107.471,1068.934,105.623,1068.327,103.734,1068.388z" />
                            <path style="fill: var(--color-font-1)" d="M93.203,1208.7c-15.382,1.072-31.39,4.859-48.406,12.344c-4.047,1.777-5.887,6.5-4.109,10.547s6.5,5.887,10.547,4.109l0,0c30.981-13.627,56.35-13.629,83.03-7.531c4.279,1.102,8.641-1.475,9.742-5.754c1.101-4.279-1.475-8.641-5.754-9.742c-0.141-0.037-0.282-0.068-0.425-0.098C123.354,1209.266,108.587,1207.624,93.203,1208.7L93.203,1208.7z" />
                            <path style="fill: var(--color-font-1)" d="M369.984,1201.263c-14.917-0.225-28.656,2.047-42.469,3.125c-4.41,0.336-7.712,4.184-7.376,8.592c0.336,4.41,4.183,7.713,8.592,7.377c29.392-2.293,50.901-8.68,83.813,7.219c3.904,2.068,8.747,0.582,10.816-3.322s0.582-8.746-3.322-10.816c-0.182-0.096-0.367-0.186-0.556-0.268c-18.512-8.943-34.582-11.68-49.499-11.906H369.984z" />
                            <path style="fill: var(--color-font-1)" d="M360.016,1068.388c-1.796,0.014-3.535,0.629-4.938,1.75c-31.296,24.119-45.662,50.006-58.125,74.531c-2.002,3.943-0.428,8.764,3.516,10.766c3.944,2.002,8.764,0.428,10.766-3.516c12.293-24.191,24.757-46.9,53.594-69.125c3.538-2.648,4.259-7.662,1.611-11.199C364.926,1069.571,362.544,1068.382,360.016,1068.388z" />
                            <path style="fill: var(--color-font-1)" d="M328.111,1276.419c-4.417-0.107-8.086,3.385-8.194,7.803c-0.097,3.949,2.704,7.379,6.594,8.072c23.91,4.873,38.286,21.146,50.374,43.781c1.977,3.951,6.784,5.553,10.735,3.574c3.952-1.977,5.552-6.783,3.575-10.734c-0.068-0.137-0.14-0.27-0.216-0.402c-13.146-24.615-31.597-45.855-61.282-51.906c-0.526-0.117-1.062-0.182-1.6-0.191L328.111,1276.419z" />
                            <path style="fill: var(--color-font-1)" d="M271.797,1316.294c-4.418,0.09-7.927,3.742-7.838,8.16c0.038,1.875,0.732,3.676,1.962,5.09c23.275,27.518,21.758,48.701,22.094,74.938c0.055,4.418,3.681,7.955,8.099,7.9c4.418-0.055,7.956-3.68,7.901-8.098c0-0.01,0-0.018,0-0.027c-0.336-25.648,0.416-53.975-25.875-85.063c-1.559-1.889-3.896-2.959-6.344-2.906L271.797,1316.294z" />
                            <path style="fill: var(--color-font-1)" d="M144.173,1276.325c-0.718,0-1.433,0.096-2.125,0.287c-38.275,9.793-48.533,33.836-60.438,51.063c-2.626,3.555-1.873,8.564,1.681,11.189c3.554,2.625,8.564,1.873,11.189-1.682c0.1-0.135,0.195-0.273,0.286-0.414c13.403-19.395,17.99-36.146,51.25-44.656c4.297-1.029,6.946-5.348,5.916-9.645c-0.861-3.592-4.067-6.127-7.759-6.137V1276.325z" />
                            <path style="fill: var(--color-font-1)" d="M200.266,1316.263c-2.917-0.059-5.635,1.473-7.093,4c-16.816,28.021-22.731,57.02-17,85.686c0.816,4.342,4.999,7.201,9.341,6.385s7.201-4.998,6.385-9.342c-0.012-0.064-0.026-0.131-0.04-0.197c-4.926-24.648-0.176-48.984,15.032-74.314c2.329-3.754,1.174-8.688-2.581-11.016C203.094,1316.708,201.697,1316.294,200.266,1316.263z" />
                        </g>
                        <path style="fill: var(--color-font-1)" d="M58.743,1071.813c-2.153,0.059-4.193,0.982-5.656,2.563l-15.75,16.938l-21.25-9.094	c-4.061-1.742-8.765,0.137-10.507,4.197c-0.983,2.293-0.842,4.912,0.383,7.084l11.25,20.188l-15.219,17.406	c-2.918,3.318-2.593,8.373,0.726,11.291c1.877,1.65,4.418,2.328,6.868,1.834l22.656-4.469l11.875,19.844	c2.266,3.793,7.178,5.031,10.972,2.766c2.128-1.271,3.547-3.459,3.841-5.92l2.75-22.969l22.562-5.125	c4.307-0.986,6.999-5.277,6.012-9.586c-0.553-2.414-2.195-4.438-4.444-5.477l-20.968-9.719l2.062-23.031	c0.398-4.4-2.847-8.291-7.248-8.689c-0.302-0.025-0.605-0.037-0.909-0.029L58.743,1071.813z M48.867,1102.438l-0.464,5.313	c-0.315,3.369,1.524,6.574,4.594,8l4.813,2.219l-5.157,1.184c-3.302,0.742-5.78,3.482-6.187,6.844l-0.624,5.281l-2.718-4.563	c-1.735-2.91-5.116-4.412-8.438-3.748l-5.218,0.992l3.499-4c2.225-2.541,2.616-6.203,0.976-9.156l-2.594-4.656l4.907,2.094	c3.102,1.326,6.702,0.563,9-1.906L48.867,1102.438z" />
                        <path style="fill: var(--color-font-1)" d="M354.898,1378.251c-1.342,0.037-2.652,0.412-3.811,1.088c-1.876,1.09-3.23,2.895-3.75,5	l-5.531,22.406l-23,2.344c-4.399,0.416-7.629,4.318-7.214,8.717c0.236,2.502,1.634,4.748,3.775,6.064l19.658,12.219	l-4.875,22.594c-0.932,4.32,1.814,8.576,6.134,9.508c2.418,0.521,4.941-0.104,6.834-1.695l17.688-14.906l20,11.625	c3.835,2.195,8.723,0.865,10.918-2.971c1.212-2.115,1.391-4.67,0.488-6.936l-8.688-21.469l17.219-15.375	c3.309-2.93,3.616-7.984,0.688-11.293c-1.659-1.875-4.099-2.865-6.595-2.676l-23.062,1.686l-9.344-21.188	c-1.316-2.963-4.29-4.838-7.531-4.75L354.898,1378.251z M357.274,1410.938l2.125,4.844c1.366,3.096,4.531,4.998,7.906,4.75	l5.282-0.367l-3.938,3.531c-2.521,2.248-3.358,5.838-2.093,8.969l2.03,4.969l-4.624-2.688c-2.92-1.707-6.6-1.395-9.189,0.783	l-4.062,3.438l1.12-5.219c0.713-3.291-0.71-6.676-3.562-8.469l-4.531-2.813l5.28-0.527c3.364-0.336,6.154-2.75,6.97-6.031	L357.274,1410.938z" />
                    </g>
                    <path style="fill: var(--color-font-1)" d="M216.019,1396.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S216.019,1391.95,216.019,1396.368L216.019,1396.368z" />
                    <path style="fill: var(--color-font-1)" d="M40.019,1300.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S40.019,1295.95,40.019,1300.368z" />
                    <path style="fill: var(--color-font-1)" d="M128.019,1372.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S128.019,1367.95,128.019,1372.368z" />
                    <path style="fill: var(--color-font-1)" d="M112.019,1164.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S112.019,1159.95,112.019,1164.368z" />
                    <path style="fill: var(--color-font-1)" d="M352.019,1156.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S352.019,1151.95,352.019,1156.368z" />
                    <path style="fill: var(--color-font-1)" d="M384.019,1244.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S384.019,1239.95,384.019,1244.368z" />
                    <path style="fill: var(--color-font-1)" d="M328.019,1356.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S328.019,1351.95,328.019,1356.368z" />
                    <path style="fill: var(--color-font-1)" d="M160.019,1076.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S160.019,1071.95,160.019,1076.368z" />
                    <path style="fill: var(--color-font-1)" d="M224.019,1028.369c0,4.418,3.582,8,8,8s8-3.582,8-8c0-4.418-3.582-8-8-8S224.019,1023.951,224.019,1028.369z" />
                    <path style="fill: var(--color-font-1)" d="M288.019,1076.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S288.019,1071.95,288.019,1076.368z" />
                    <path style="fill: var(--color-font-1)" d="M72.019,1252.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S72.019,1247.95,72.019,1252.368z" />
                    <path style="fill: var(--color-font-1)" d="M64.019,1356.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S64.019,1351.95,64.019,1356.368z" />
                    <path style="fill: var(--color-font-1)" d="M16.019,1236.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S16.019,1231.95,16.019,1236.368z" />
                    <path style="fill: var(--color-font-1)" d="M368.019,1060.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S368.019,1055.95,368.019,1060.368z" />
                    <path style="fill: var(--color-font-1)" d="M432.019,1228.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S432.019,1223.95,432.019,1228.368z" />
                    <path style="fill: var(--color-font-1)" d="M392.019,1356.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S392.019,1351.95,392.019,1356.368z" />
                    <path style="fill: var(--color-font-1)" d="M176.019,1428.368c0,4.418,3.582,8,8,8s8-3.582,8-8s-3.582-8-8-8S176.019,1423.95,176.019,1428.368z" />
                </g>
            </g>
        </svg>
        <span>{{ $t('好耶') }}!</span>
        <a>{{
            $t('该说的都说了 —— 那么就可以愉快的用啦（大声），如果遇到什么奇怪的问题，尽管来 GitHub 仓库问哦。')
        }}</a>
        <button class="ss-button wel-next-end" @click="uiStore.popBoxList.shift()">
            {{ $t('关闭') }}
        </button>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { i18n } from '@renderer/main'
    import languages from '@renderer/assets/l10n/_l10nconfig.json'
    import { runASWEvent as save } from '@renderer/function/option'
    import { openLink, sendIdentifyData } from '@renderer/function/utils/appUtil'
    import { useSettingsStore } from '@renderer/state/settings'
    import { useUIStore } from '@renderer/state/ui'

    const settingsStore = useSettingsStore()
    const uiStore = useUIStore()

    defineOptions({ name: 'WelcomePan' })

    const $t = i18n.global.t

    defineProps({
        data: {
            type: null,
            default: undefined
        }
    })

    const napcat = import.meta.env.VITE_NAPCAT
    const repoName = import.meta.env.VITE_APP_REPO_NAME
    const show = ref('home')
    const colors = [
        '林槐蓝',
        '墨竹青',
        '少女粉',
        '微软紫',
        '坏猫黄',
        '玄素黑',
    ]

    function changeView(name: string) {
        if(show.value === name || show.value === 'license') return
        show.value = name
    }

    function gaLanguage(event: Event) {
        const sender = event.target as HTMLInputElement
        sendIdentifyData({ use_language: sender.value })
        // TODO: 刷新菜单
    }

    function setPage(name: string) {
        show.value = name
    }
</script>

<style scoped>
    .wel-next {
        background: var(--color-card-2);
        color: var(--color-font);
        padding: 0 15px;
        cursor: pointer;
        position: absolute;
        bottom: 10px;
        right: 15px
    }
    .wel-next-end {
        background: var(--color-main);
        color: var(--color-font-r);
        padding: 0 15px;
        cursor: pointer;
        position: absolute;
        bottom: 10px;
        right: 15px
    }
    .base-box {
        padding-bottom: 30px !important;
    }

    .wel-home {
        flex-direction: column;
        align-items: center;
        display: flex;
    }

    .wel-home > img {
        width: 90px;
        margin-top: -70px;
        margin-bottom: 20px;
        color: var(--color-main);
    }

    .wel-home > span {
        font-size: 0.8rem;
        color: var(--color-font-2);
    }

    .wel-home > div {
        margin-top: 5px;
    }

    .wel-home > div > span {
        font-size: 1.2rem;
    }

    .wel-home > div > a {
        color: var(--color-font-r);
        background: var(--color-main);
        line-height: 1.2rem;
        margin-left: 5px;
        border-radius: 2rem;
        padding: 4px 10px 0 10px;
    }

    .wel-home > hr {
        background: var(--color-font-2);
        width: 40%;
        opacity: 0.5;
    }

    .wel-end > a,
    .wel-home > a {
        color: var(--color-font-1);
        margin-bottom: 20px;
        text-align: center;
        font-size: 0.8rem;
    }

    .wel-opt-item > div:first-child {
        margin-left: 0 !important;
        max-width: unset !important;
        height: unset !important;
    }

    .l10n-info {
        width: calc(100% - 40px) !important;
        background: transparent !important;
        border-left: unset !important;
        margin-bottom:  0 !important;
    }

    .l10n-info select {
        width: 100%;
        border: 0;
        color: var(--color-font);
        margin-bottom: 3px;
        border-left: 4px solid var(--color-main);
        background: var(--color-card-1);
        border-radius: 4px;
        padding: 5px 10px 9px 10px;
    }

    .wel-end {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .wel-end > span {
        margin-top: 10px;
        font-size: 1.3rem;
    }

    .step-line {
        display: flex;
        margin: 10px auto 0 auto;
        width: calc(100% - 50px);
        background: var(--color-card-1);
        padding: 7px !important;
        border-radius: 100px;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    .step-line > svg {
        cursor: pointer;
        margin: 0 10px;
        padding: 5px;
    }
    .step-line > div {
        width: 10px;
        height: 2px;
        background: var(--color-font);
        border-radius: 2px;
    }
    .step-line > svg.select {
        cursor: unset;
        border-radius: 100%;
        background: var(--color-main);
        color: var(--color-font-r);
        width: 0.8rem;
        height: 0.8rem;
    }

    .lead {
        flex-direction: row;
        display: flex;
        flex-wrap: wrap;
    }
    .lead > span:nth-child(1) {
        font-size: 1.1rem;
        color: var(--color-main);
        text-align: center;
        width: 100%;
        margin-bottom: 10px;
    }
    .lead > div:nth-child(2) {
        max-width: 5px;
        background: var(--color-main);
        flex: 1;
        border-radius: 7px;
        box-shadow: 0 0 5px var(--color-shader);
        margin-right: 20px;
    }
    .lead > div:nth-child(3) {
        display: flex;
        flex-direction: column;
    }
    .lead > span:nth-child(4) {
        font-size: 0.8rem;
        color: var(--color-font-2);
        width: 100%;
        text-align: center;
        margin-top: 20px;
    }
    .lead > div > span {
        color: var(--color-font);
    }
    .lead > div > a {
        color: var(--color-font-2);
        margin-left: 20px;
        text-decoration: underline;
        cursor: pointer;
    }

    .function > div.config {
        flex-direction: row;
        display: flex;
    }
    .function > div.config > div:first-child {
        height: 45vh;
        margin-left: -25vh;
        width: 40vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .function > div.config > div:last-child {
        flex-direction: column;
        margin-left: 20px;
        display: flex;
        flex: 1;
    }
    .function > div.config > div:last-child > span {
        color: var(--color-main);
        display: block;
        font-size: 1rem;
    }
    .function > div.config > div:last-child > a {
        color: var(--color-font-2);
        margin-bottom: 10px;
        font-size: 0.85rem;
        display: block;
    }
    .function > div.config > div:last-child > div {
        border-left: 3px solid var(--color-main);
        padding: 0 0 0 10px;
        border-radius: 3px;
        margin-top: 5px;
        flex-wrap: wrap;
    }
    .function > div.config > div:last-child > div select {
        width: 100%;
    }
    .function > div.config > div:last-child > div:hover {
        background: transparent !important;
    }

    .bubble_sort_user > div {
        background: var(--color-card-1);
        box-shadow: 0 0 5px var(--color-shader);
        border-radius: 7px;
        display: flex;
        padding: 10px;
        margin-bottom: 10px;
    }
    .bubble_sort_user > div > div:first-child {
        background: var(--color-card-2);
        margin-right: 10px;
        border-radius: 7px;
        overflow: hidden;
        height: 35px;
        width: 35px;
    }
    .bubble_sort_user > div > div:first-child > svg {
        background: var(--color-main);
        color: var(--color-font-r);
        height: calc(100% - 20px);
        width: calc(100% - 20px);
        padding: 10px;
    }
    .bubble_sort_user > div > div:last-child {
        flex: 1;
    }
    .bubble_sort_user > div > div:last-child > div:first-child {
        color: var(--color-main);
        font-size: 0.85rem;
    }
    .bubble_sort_user > div:not(:first-child) > div:last-child > div:first-child {
        background: var(--color-card-2);
        border-radius: 7px;
        height: 0.85rem;
    }
    .bubble_sort_user > div > div:last-child > div:last-child {
        background: var(--color-card-2);
        border-radius: 7px;
        margin-top: 5px;
        height: 0.8rem;
        width: 100%;
    }

    .theme_color > div {
        margin-bottom: 10px;
        display: flex;
    }
    .theme_color > div.me {
        flex-direction: row-reverse;
        transform: translateX(35px);
    }
    .theme_color > div:not(.me) {
        transform: translateX(-35px);
    }
    .theme_color > div > div:first-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        border-radius: 100%;
        height: 35px;
        width: 35px;
    }
    .theme_color > div.me > div:first-child {
        opacity: 0;
    }
    .theme_color > div > div:last-child {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
        margin: 0 10px;
    }
    .theme_color > div.me > div:last-child {
        align-items: flex-end;
    }
    .theme_color > div > div:last-child > div:first-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        border-radius: 7px;
        height: 0.8rem;
        width: 60%;
    }
    .theme_color > div > div:last-child > div:last-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        height: calc(0.8rem + 20px);
        border-radius: 7px;
        margin-top: 10px;
        width: 100%;
    }
    .theme_color > div.me > div:last-child > div {
        background: var(--color-main);
    }

    .menu > a > div {
        width: 20vh;
        background: var(--color-card-2);
        box-shadow: 0 0 5px var(--color-shader);
        border-radius: 7px;
        margin: 0 auto 0 auto;
        transform: translate(5vh, -30px);
        padding: 5px
    }
    .menu > a > div > div {
        align-items: center;
        border-radius: 7px;
        height: 1.1rem;
        display: flex;
        margin: 3px 0;
    }
    .menu > a > div > div.select {
        background: var(--color-main);
    }
    .menu > a > div > div > svg {
        color: var(--color-font-1-r);
        opacity: 0.9;
        margin: 5px;
    }
    .menu > a > div > div > span {
        color: var(--color-font-1-r);
        font-size: 0.7rem;
    }
    .menu > a > div > div > div:first-child {
        background: var(--color-card-1);
        border-radius: 7px;
        height: 1rem;
        width: 1rem;
    }
    .menu > a > div > div > div:last-child {
        background: var(--color-card-1);
        border-radius: 7px;
        margin-left: 3px;
        height: 1rem;
        flex: 1;
    }

    .chat_pic_pan {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        height: calc(40vh - 40px);
        flex-direction: column;
        pointer-events: none;
        border-radius: 7px;
        display: flex;
        padding: 10px;
        margin: 20px;
    }
    .chat_pic_pan > div:first-child {
        justify-content: space-between;
        display: flex;
    }
    .chat_pic_pan > div:first-child > div:first-child {
        background: var(--color-card-2);
        border-radius: 7px;
        height: 1rem;
        width: 15vh;
    }
    .chat_pic_pan > div:first-child > div:last-child {
        background: var(--color-main);
        color: var(--color-font-r);
        height: calc(1rem + 3px);
        font-size: 0.7rem;
        text-align: center;
        border-radius: 7px;
        width: 7vh;
    }
    .chat_pic_pan > div:nth-child(2) {
        flex-direction: column;
        display: flex;
        flex: 1;
        overflow-y: scroll;
        margin: 2px;
    }
    .chat_pic_pan > div:nth-child(2) > svg {
        border: 2px solid var(--color-card-2);
        color: var(--color-font-2);
        border-radius: 7px;
        margin-right: 5px;
        margin-top: 5px;
        padding: 26% 0;
    }
    .chat_pic_pan > div:last-child {
        display: flex;
    }
    .chat_pic_pan > div:last-child > div:first-child {
        background: var(--color-card-2);
        border-radius: 7px;
        height: 5vh;
        width: 5vh;
    }
    .chat_pic_pan > div:last-child > div:last-child {
        background: var(--color-card-2);
        margin-left: 5px;
        border-radius: 7px;
        height: 5vh;
        flex: 1;
    }

    .input_bar > div:first-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        pointer-events: none;
        overflow-y: scroll;
        border-radius: 7px;
        max-height: 6rem;
        padding: 3px 5px;
        width: 80%;
    }
    .input_bar > div:first-child > div {
        align-items: center;
        padding: 3px 5px;
        display: flex;
    }
    .input_bar > div:first-child > div.select {
        background: var(--color-main);
        border-radius: 7px;
    }
    .input_bar > div:first-child > div > div:first-child {
        height: 1rem;
        width: 1rem;
        background: var(--color-card-2);
        border-radius: 100%;
        margin: 3px 0;
    }
    .input_bar > div:first-child > div > div:last-child {
        margin-left: 5px
    }
    .input_bar > div:first-child > div.select > div:last-child {
        color: var(--color-font-r);
        font-size: 0.8rem;
    }
    .input_bar > div:first-child > div:not(.select) > div:last-child {
        background: var(--color-card-2);
        height: 1rem;
        flex: 1;
        border-radius: 7px;
        padding: 3px 5px;
    }
    .input_bar > div:last-child {
        margin-top: 10px;
        display: flex;
        width: 100%;
    }
    .input_bar > div:last-child > div:first-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        border-radius: 7px;
        height: 2rem;
        width: 2rem;
    }
    .input_bar > div:last-child > div:last-child {
        box-shadow: 0 0 5px var(--color-shader);
        background: var(--color-card-1);
        color: var(--color-font-2);
        margin-right: -10px;
        align-items: center;
        border-radius: 7px;
        font-size: 0.8rem;
        margin-left: 5px;
        padding: 0 10px;
        display: flex;
        height: 2rem;
        flex: 1;
    }

    @media (max-width: 700px) {
        .function {
            overflow-y: scroll;
            overflow-x: hidden;
            margin: 30px 0;
        }
        .function > div.config {
            flex-direction: column;
        }
        .function > div.config > div:first-child {
            align-items: center;
            margin-left: 0;
            width: 100%;
        }
        .function > div.config > div:first-child > div {
            width: 80%;
        }
        .theme_color {
            margin-left: 35px;
        }
    }
</style>
