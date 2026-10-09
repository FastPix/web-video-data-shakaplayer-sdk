type PlayerStats = {
  height: number;
  width: number;
  droppedFrames: number;
};

// Mirrors the subset of shaka.extern.Track the adapter reads. `bandwidth` is
// the whole variant, video and audio together - `audioBandwidth` is the audio
// share of it, not something to add on top.
// The subset of shaka.extern.IAd the adapter reads. Every method is optional:
// getCreativeAdId and getAdvertiserName are absent on older builds, and an ad
// from one mechanism may not implement what another does.
type ShakaAd = {
  getAdId?: () => string | null;
  getCreativeAdId?: () => string | null;
  getAdvertiserName?: () => string | null;
  getDuration?: () => number;
  getMediaUrl?: () => string | null;
  getPodIndex?: () => number;
  getPositionInSequence?: () => number;
  getSequenceLength?: () => number;
  getTimeOffset?: () => number;
  getTimeUntilSkippable?: () => number;
  isSkippable?: () => boolean;
};

type AdManager = {
  addEventListener: (event: string, callback: EventListener) => void;
  removeEventListener?: (event: string, callback: EventListener) => void;
};

type ManifestVariant = {
  id: number;
  audio?: { bandwidth?: number } | null;
};

type Manifest = {
  variants?: ManifestVariant[];
};

type VariantTrack = {
  active: boolean;
  id?: number;
  bandwidth?: number;
  videoCodec?: string | null;
  frameRate?: number | null;
  width?: number | null;
  height?: number | null;
  audioCodec?: string | null;
  audioBandwidth?: number | null;
  hdr?: string | null;
  language?: string;
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
  getManifest?: () => Manifest | null;
  getPlayheadTimeAsDate?: () => Date | null;
  getAdManager?: () => AdManager | null;
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
  Manifest,
  ManifestVariant,
  ShakaAd,
  AdManager,
  VariantTrack,
  NetworkingEngine,
  EventsInterface,
  UtilityInterface,
  CoreInterface,
  VideoPlayer,
};
