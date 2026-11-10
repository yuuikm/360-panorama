declare global {
  interface Window {
    pannellum?: {
      viewer: (
        container: HTMLElement | string,
        config: PannellumConfig
      ) => PannellumViewer;
    };
  }
}

export interface PannellumHotspot {
  id?: string | number;
  pitch: number;
  yaw: number;
  type?: 'scene' | 'info';
  text?: string;
  createTooltipFunc?: (hotSpotDiv: HTMLElement, args: any) => void;
  createTooltipArgs?: any;
  clickHandlerFunc?: (evt: MouseEvent, args: any) => void;
  clickHandlerArgs?: any;
  cssClass?: string;
  URL?: string;
}

export interface PannellumConfig {
  type: 'equirectangular' | 'cubemap' | 'multires';
  panorama: string;
  autoLoad?: boolean;
  autoRotate?: number;
  compass?: boolean;
  showZoomCtrl?: boolean;
  showFullscreenCtrl?: boolean;
  mouseZoom?: boolean;
  doubleClickZoom?: boolean;
  draggable?: boolean;
  friction?: number;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  minHfov?: number;
  maxHfov?: number;
  minPitch?: number;
  maxPitch?: number;
  hotSpots?: PannellumHotspot[];
  preview?: string;
  strings?: Record<string, string>;
}

export interface PannellumViewer {
  getYaw: () => number;
  getPitch: () => number;
  getHfov: () => number;
  setYaw: (yaw: number, animated?: boolean) => void;
  setPitch: (pitch: number, animated?: boolean) => void;
  setHfov: (hfov: number, animated?: boolean) => void;
  mouseEventToCoords: (event: MouseEvent) => [number, number]; // [pitch, yaw]
  addHotSpot: (hs: PannellumHotspot, sceneId?: string) => void;
  removeHotSpot: (id: string | number, sceneId?: string) => void;
  destroy: () => void;
  resize: () => void;
  on: (type: string, listener: (arg?: any) => void) => void;
  off: (type: string, listener: (arg?: any) => void) => void;
  isLoaded: () => boolean;
}

