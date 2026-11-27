import { WebPlugin } from '@capacitor/core';

import type { OnebotCloseOptions, OnebotConnectOptions, OnebotPlugin } from './definitions';

export class OnebotWeb extends WebPlugin implements OnebotPlugin {
    getFinalRedirectUrl(options: { url: string; }): Promise<{ url: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ url: options.url });
    }
    getHtml(options: { url: string; }): Promise<{ data: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ data: '' });
    }
    getApi(options: { url: string; }): Promise<{ data: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ data: '' });
    }
    getImageData(options: { url: string; }): Promise<{ data: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ data: '' });
    }
    async connect(_: OnebotConnectOptions): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async send(_: { data: string; }): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async close(_?: OnebotCloseOptions): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async findService(): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async changeIcon(_: { name: string; }): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async getUsedIcon(): Promise<{ success: boolean; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: true });
    }

    async getRelease(): Promise<{ release: string, arch: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ release: '', arch: '' });
    }

    async getSystemInfo(): Promise<{ success: string; }> {
        console.warn('本插件不提供 Web 端实现。');
        return Promise.resolve({ success: '' });
    }
}
