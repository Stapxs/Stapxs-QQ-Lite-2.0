let fist_load = true

function changeColor(type) {
    if(!fist_load) {
        // 启用颜色渐变动画
        document.body.style.transition = 'background, color, background-color .3s'
    } else {
        fist_load = false
    }
    // 切换颜色
    let match_list = ['color-.*\.css', 'prism-.*\.css']
    const css_list = document.getElementsByTagName("link")
    for(let i=0; i<css_list.length; i++) {
        name = css_list[i].href
        match_list.forEach(function (value) {
            if(name.match(value) != null) {
                const newLink = document.createElement("link");
                newLink.setAttribute("rel", "stylesheet");
                newLink.setAttribute("type", "text/css");
                if(type === "dark") {
                    newLink.setAttribute("href", name.replace('light', 'dark'));
                } else {
                    newLink.setAttribute("href", name.replace('dark', 'light'));
                }
                document.getElementsByTagName("head").item(0).replaceChild(newLink, css_list[i]);
            }
        })
    }
}

function foldChange(sender) {
    const svg = sender.getElementsByTagName('svg');
    if(svg[0].style.transform === 'rotate(-90deg)') {
        svg[0].style.transform = 'rotate(90deg)'
        animateScroll(sender, 40)
    } else {
        svg[0].style.transform = 'rotate(-90deg)'
    }
}

function animateScroll(element, speed) {
    let rect=element.getBoundingClientRect()
    let top=window.pageYOffset+rect.top
    let currentTop=document.documentElement.scrollTop
    let requestId
    function step(timestamp) {
        currentTop+=speed
        if(currentTop<=top){
            window.scrollTo(0,currentTop)
            requestId=window.requestAnimationFrame(step)
        }else{
            window.cancelAnimationFrame(requestId)
        }
    }
    window.requestAnimationFrame(step)
}

function scrollDiv(sender) {
    const par_body = sender.parentNode
    const line = par_body.getElementsByClassName('scroll-top')[0];
    if(sender.scrollTop === 0) {
        line.style.display = 'none'
    } else {
        line.style.display = 'block'
    }
}

function getQueryVariable(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split("&");
    for (let i=0; i<vars.length; i++) {
        const pair = vars[i].split("=");
        if(pair[0] === variable){
            return pair[1]
        }
    }
    return false
}

function initCodeInput(body, fun, regex) {
    // 初始化输入框
    if(body.classList.toString().indexOf('ss-code-input') >= 0) {
        // 初始化 label onclick 事件
        body.onclick = function () { codeInputAllow(body) }
        // 初始化主输入框
        const input = body.getElementsByTagName('input')[0]
        input.oninput = function() { codeInputChanged(body, fun, regex) }
        input.onblur = function() { codeInputNoAllow(body) }
        input.dataset.typeing = "false"
        input.addEventListener('compositionstart',function(e){ input.dataset.typeing = "true" }, false)
        input.addEventListener('compositionend',function(e){ input.dataset.typeing = "false"; }, false)
        if(input !== undefined) {
            // 添加显示输入框
            for(var i=0; i<body.dataset.num; i++) {
                // 构建
                let inputShow = document.createElement("input")
                inputShow.onclick = function () { codeInputAllow(body) }
                inputShow.dataset.id = (i+1).toString()
                inputShow.disabled = true
                // 添加
                body.appendChild(inputShow)
            }
        }
    }
}

function codeInputAllow(body) {
    // 输入框 label 点击事件
    const inputs = body.getElementsByTagName('input')
    inputs[0].focus()
    codeInputChanged(body)
}

function codeInputNoAllow(body) {
    const inputs = body.getElementsByTagName('input')
    for(let i=1; i<inputs.length; i++) {
        inputs[i].classList = ""
    }
}

function codeInputChanged(body, fun, regex) {
    // 主输入框变化事件
    const inputs = body.getElementsByTagName('input')
    if(inputs !== undefined && inputs.length > 1 && inputs[0].dataset.typeing === "false") {
        if(regex === undefined) {
            regex = ""
        }
        if(inputs[0].dataset.up === "true") {
            inputs[0].value = inputs[0].value.toUpperCase()
        }
        // 变更输入框内容
        for(let i=1; i<inputs.length; i++) {
            inputs[i].value = ""
        }
        for(let i=0; i<inputs[0].value.length; i++) {
            // 检查正则表达式
            const reg = new RegExp(regex)
            if(reg.test(inputs[0].value.substring(i, i+1))) {
                if(i < inputs.length - 2) {
                    inputs[i+1].classList = ""
                    inputs[i+1].value = inputs[0].value.substring(i, i+1)
                    if(i + 2 < inputs.length) {
                        inputs[i+2].classList = "ss-code-input-selete"
                    }
                    if(i + 3 < inputs.length) {
                        inputs[i+3].classList = ""
                    }
                } else if( i == inputs.length - 2) {
                    inputs[i+1].value = inputs[0].value.substring(i, i+1)
                    if(fun !== undefined) {
                        // 触发函数
                        inputs[0].disabled = true
                        // 完成部分动画
                        setTimeout(() => {
                            fun()
                        }, 300)
                    }
                }
            } else {
                inputs[0].value = inputs[0].value.substring(0, inputs[0].value.length - 1)
                inputs[i+1].classList = "ss-code-input-selete ss-code-input-err"
                setTimeout(() => {
                    inputs[i+1].classList = "ss-code-input-selete"
                }, 500)
            }
        }
        if(inputs[0].value.length == 0) {
            inputs[1].classList = "ss-code-input-selete"
            inputs[2].classList = ""
        }
        // 防止光标不在最后
        inputs[0].setSelectionRange(inputs[0].value.length, inputs[0].value.length)
    }
}

function getCodeInput(body) {
    if(body.classList.toString().indexOf('ss-code-input') >= 0) {
        const inputs = body.getElementsByTagName('input')
        return inputs[0].value.substring(0, inputs.length - 1)
    }
}

function cleanCodeInput(body) {
    if(body.classList.toString().indexOf('ss-code-input') >= 0) {
        const inputs = body.getElementsByTagName('input')
        inputs[0].value = ""
        inputs[0].disabled = false
        for(let i=1; i<inputs.length; i++) {
            inputs[i].classList = ""
        }
        codeInputChanged(body)
    }
}