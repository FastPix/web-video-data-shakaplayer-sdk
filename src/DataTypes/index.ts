type PlayerStats = {
  height: number;
  width: number;
  droppedFrames: number;
};

type VariantTrack = {
  active: boolean;
  bandwidth?: number;
  videoCodec?: string;
  frameRate?: number;
};

type NetworkingEngine = {
  registerResponseFilter: (
    callback: (requestType: string, options: any) => void,
  ) => void;
};

type EventsInterface = {
  data: Record<string, any>;
  automaticErrorTracking?: boolean;
  fetchPlayheadTime?: () => number;
  fetchStateData?: () => Record<string, any>;
};

type UtilityInterface = {
  convertSecToMs: (seconds: number) => number;
  generateIdToken: () => string;
  now: () => number;
  fetchHost: (uri: string) => string;
};

type CoreInterface = {
  utilityMethods: UtilityInterface;
  dispatch: (token: string, eventName: string, data?: any) => void;
  configure: (token: string, options: EventsInterface) => void;
};

type VideoPlayer = {
  getMediaElement: () => HTMLMediaElement | null;
  getStats: () => PlayerStats;
  getVariantTracks: () => VariantTrack[];
  getAssetUri: () => string;
  constructor: { version: string };
  getNetworkingEngine: () => NetworkingEngine;
  addEventListener: (event: string, callback: EventListener) => void;
  removeEventListener: (event: string, callback: EventListener) => void;
  fp: {
    dispatch: (eventName: string, data?: any) => void;
    destroy: () => void;
  };
};

export type {
  PlayerStats,
  VariantTrack,
  NetworkingEngine,
  EventsInterface,
  UtilityInterface,
  CoreInterface,
  VideoPlayer,
};
