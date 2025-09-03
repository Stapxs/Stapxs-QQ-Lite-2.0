/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
    // 继承的规则配置
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-recommended',
        '@electron-toolkit',
        '@electron-toolkit/eslint-config-ts/eslint-recommended',
        '@vue/eslint-config-typescript/recommended',
    ],
    rules: {
        // === 基础规则 ===
        // 忽略使用 any 类型的错误
        '@typescript-eslint/no-explicit-any': 'off',
        // debugger
        'no-debugger': 'warn',
        // console
        'no-console': 'warn',
        // 优先使用箭头函数
        'prefer-arrow-callback': 'warn',
        // 引号
        'quotes': ['warn', 'single'],
        // 三元表达式
        'multiline-ternary': ['warn', 'never'],
        // 未使用的变量
        '@typescript-eslint/no-unused-vars': [
            'error',
            { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
        ],

        // === Vue 相关规则 ===
        // html 缩进
        'vue/html-indent': ['warn', 4, {
            'alignAttributesVertically': false
        }],
        // html 标签闭合
        'vue/html-closing-bracket-spacing': ['warn', {
            'selfClosingTag': 'always'
        }],
        // 每行最大属性数
        'vue/max-attributes-per-line': ['warn', {
            'singleline': { 'max': 3 },
            'multiline': { 'max': 3 }
        }],
        // 属性换行设置
        'vue/first-attribute-linebreak': ['warn', {
            'singleline': 'ignore',
            'multiline': 'ignore'
        }],
        // html 标签换行
        'vue/html-closing-bracket-newline': ['warn', {
            'multiline': 'never'
        }],
        // html 引号
        'vue/html-quotes': [ 'warn',
            'double',
            { 'avoidEscape': true }
        ],
        // v-for 分隔符
        'vue/v-for-delimiter-style': ['error', 'in'],
        // 组件 name 属性
        'vue/require-name-property': 'warn',
        // 属性简写
        'vue/prefer-true-attribute-shorthand': 'warn',
        // prop 类型
        'vue/require-prop-types': 'off',
        // v-html
        'vue/no-v-html': 'off',
    },
}
