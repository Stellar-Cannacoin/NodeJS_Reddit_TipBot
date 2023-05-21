/// <reference types="urijs" />
import { Asset } from "stellar-base";
import { CallBuilder } from "./call_builder";
import { ServerApi } from "./server_api";
export declare class LiquidityPoolCallBuilder extends CallBuilder<ServerApi.CollectionPage<ServerApi.LiquidityPoolRecord>> {
    constructor(serverUrl: URI);
    forAssets(...assets: Asset[]): this;
    forAccount(id: string): this;
    liquidityPoolId(id: string): CallBuilder<ServerApi.LiquidityPoolRecord>;
}
