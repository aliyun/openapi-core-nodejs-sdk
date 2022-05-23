export = RPCClient;

/*~ Write your module's methods and properties in this class */
declare class RPCClient {
    constructor(config: RPCClient.Config);

    request<T>(action: String, params: Object, options?: Object): Promise<T>;
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 */
declare namespace RPCClient {
    export interface Config {
        endpoint: string;
        apiVersion: string;
        accessKeyId: string;
        accessKeySecret: string;
        securityToken?: string;
        codes?: (string | number)[];
        opts?: object;
    }
}
