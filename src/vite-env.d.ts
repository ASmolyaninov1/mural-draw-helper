/// <reference types="vite/client" />
type MuralSdkType = Record<string, any>

export declare global {
  interface Window {
    muralSdk: MuralSdkType
  }
}
