import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Station {
    url: string;
    country: string;
    name: string;
    codec: string;
    homepage: string;
    tags: string;
    language: string;
    favicon: string;
    bitrate: bigint;
}
export interface backendInterface {
    addFavorite(station: Station): Promise<void>;
    getFavorites(): Promise<Array<Station>>;
    removeFavorite(stationName: string): Promise<void>;
}
