export interface OnebotConnectOptions {
    url: string;
    connectionId?: string;
}

export interface OnebotCloseOptions {
    connectionId?: string;
    cancel?: boolean;
}

export interface OnebotPlugin {
    connect(options: OnebotConnectOptions): Promise<{ success: boolean }>;
    close(options?: OnebotCloseOptions): Promise<{ success: boolean }>;
    send(options: { data: string }): Promise<{ success: boolean }>;

    findService(): Promise<{ success: boolean }>;

    changeIcon(options: { name: string }): Promise<{ success: boolean }>;
    getUsedIcon(): Promise<{ success: boolean }>;

    getRelease(): Promise<{ release: string, arch: string }>;
    getSystemInfo(): Promise<{ success: string }>;

    getFinalRedirectUrl(options: { url: string }): Promise<{ url: string }>;
    getHtml(options: { url: string }): Promise<{ data: string }>;
    getApi(options: { url: string }): Promise<{ data: string }>;
    getImageData(options: { url: string }): Promise<{ data: string }>;
}
