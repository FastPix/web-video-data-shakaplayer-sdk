// The SDK ships JavaScript only (types are planned for a future release), so
// declare a minimal module shape here. Remove this once the package ships .d.ts.
declare module "@fastpix/video-data-shakaplayer" {
  type Integration = {
    dispatch: (eventName: string, data?: unknown) => void;
    handleLoadError: (err: unknown) => void;
  };

  const loadShakaPlayer: {
    (
      player: unknown,
      options: { debug?: boolean; automaticErrorTracking?: boolean; data: Record<string, unknown> },
      shaka?: unknown,
    ): Integration;
    utilityMethods: { now: () => number };
  };

  export default loadShakaPlayer;
}
