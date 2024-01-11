import { onRequestGet as __api_fetch_firmware_ts_onRequestGet } from "A:\\Users\\jLynx\\Documents\\Code\\Websites\\React\\MayhemHub\\functions\\api\\fetch_firmware.ts"

export const routes = [
    {
      routePath: "/api/fetch_firmware",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_fetch_firmware_ts_onRequestGet],
    },
  ]