# capacitor-onebot-connctor

这是一个提供简易的后端 Onebot Websocket 交互的 Capacitor 插件。

## Install

```bash
npm install capacitor-onebot-connctor
npx cap sync
```

## API

<docgen-index>

* [`connect(...)`](#connect)
* [`close(...)`](#close)
* [`send(...)`](#send)
* [`findService()`](#findservice)
* [`changeIcon(...)`](#changeicon)
* [`getUsedIcon()`](#getusedicon)
* [`getRelease()`](#getrelease)
* [`getSystemInfo()`](#getsysteminfo)
* [`getFinalRedirectUrl(...)`](#getfinalredirecturl)
* [`getHtml(...)`](#gethtml)
* [`getApi(...)`](#getapi)
* [`getImageData(...)`](#getimagedata)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### connect(...)

```typescript
connect(options: OnebotConnectOptions) => Promise<{ success: boolean; }>
```

| Param         | Type                                                              |
| ------------- | ----------------------------------------------------------------- |
| **`options`** | <code><a href="#onebotconnectoptions">OnebotConnectOptions</a></code> |

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### close(...)

```typescript
close(options?: OnebotCloseOptions) => Promise<{ success: boolean; }>
```

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#onebotcloseoptions">OnebotCloseOptions</a></code> |

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### send(...)

```typescript
send(options: { data: string; }) => Promise<{ success: boolean; }>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ data: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### findService()

```typescript
findService() => Promise<{ success: boolean; }>
```

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### changeIcon(...)

```typescript
changeIcon(options: { name: string; }) => Promise<{ success: boolean; }>
```

| Param         | Type                           |
| ------------- | ------------------------------ |
| **`options`** | <code>{ name: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### getUsedIcon()

```typescript
getUsedIcon() => Promise<{ success: boolean; }>
```

**Returns:** <code>Promise&lt;{ success: boolean; }&gt;</code>

--------------------


### getRelease()

```typescript
getRelease() => Promise<{ release: string; arch: string; }>
```

**Returns:** <code>Promise&lt;{ release: string; arch: string; }&gt;</code>

--------------------


### getSystemInfo()

```typescript
getSystemInfo() => Promise<{ success: string; }>
```

**Returns:** <code>Promise&lt;{ success: string; }&gt;</code>

--------------------


### getFinalRedirectUrl(...)

```typescript
getFinalRedirectUrl(options: { url: string; }) => Promise<{ url: string; }>
```

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ url: string; }</code> |

**Returns:** <code>Promise&lt;{ url: string; }&gt;</code>

--------------------


### getHtml(...)

```typescript
getHtml(options: { url: string; }) => Promise<{ data: string; }>
```

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ url: string; }</code> |

**Returns:** <code>Promise&lt;{ data: string; }&gt;</code>

--------------------


### getApi(...)

```typescript
getApi(options: { url: string; }) => Promise<{ data: string; }>
```

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ url: string; }</code> |

**Returns:** <code>Promise&lt;{ data: string; }&gt;</code>

--------------------


### getImageData(...)

```typescript
getImageData(options: { url: string; }) => Promise<{ data: string; }>
```

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ url: string; }</code> |

**Returns:** <code>Promise&lt;{ data: string; }&gt;</code>

--------------------

### Interfaces


#### OnebotConnectOptions

| Prop               | Type                |
| ------------------ | ------------------- |
| **`url`**          | <code>string</code> |
| **`connectionId`** | <code>string</code> |


#### OnebotCloseOptions

| Prop               | Type                 |
| ------------------ | -------------------- |
| **`connectionId`** | <code>string</code>  |
| **`cancel`**       | <code>boolean</code> |

</docgen-api>
