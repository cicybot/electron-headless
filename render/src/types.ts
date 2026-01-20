
export const DEFAULT_RPC_URL = "http://127.0.0.1:3456/rpc";

export interface RpcResponse<T> {
  ok: boolean;
  result?: T;
  error?: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInfo {
  id: number;
  wcId: number;
  url: string; 
  bounds?: WindowBounds;
}

export type WindowMap = Record<string, Record<string, { id: number; wcId: number; bounds?: WindowBounds }>>;

export interface NetworkLog {
    id: string;
    url: string;
    method: string;
    statusCode?: number;
    timestamp: number;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
    win_id?: number; 
    resourceType?: string;
}
