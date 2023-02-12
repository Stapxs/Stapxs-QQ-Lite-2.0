import child_process from 'child_process'

export function queryKeys(keyPath: string, value: string) {
    return new Promise(function (resolve, reject) {
        try {
            child_process.exec(`reg query ${keyPath} /v ${value}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve({stdout, stderr})
            });
        } catch (error) {
            reject(error)
        }
    }) as Promise<{stdout: any, stderr: any}>
}