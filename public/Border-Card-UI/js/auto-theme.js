// 自动暗黑模式相关代码
let media = window.matchMedia('(prefers-color-scheme: dark)');
if(is_auto_dark !== false) {
    if (media.matches) {
        changeColor("dark")
    } else {
        changeColor("light")
    }
}
let callback = (e) => {
    if(is_auto_dark) {
        console.log("正在自动切换颜色 ……")
        let prefersDarkMode = e.matches;
        if (prefersDarkMode) {
            changeColor("dark")
        } else {
            changeColor("light")
        }
    }
};
if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', callback);
} else if (typeof media.addListener === 'function') {
    media.addListener(callback);
}