/* eslint-disable no-unused-vars */
export interface Status {
  recording: boolean;
  recordingPaused: boolean;
  streaming: boolean;
  replayBuffer: boolean;
  virtualCam: boolean;
}

export const enum CONTROL_LEVEL {
  NONE = 0,
  READ_ONLY = 1,
  BASIC = 2,
  ADVANCED = 3,
  ALL = 4,
}

export interface Scene {
  name: string;
  width: number;
  height: number;
}

export interface OBSBrowser {
  getControlLevel: (callback: (level: CONTROL_LEVEL) => void) => void;
  getStatus: (callback: (status: Status) => void) => void;
  getCurrentScene: (callback: (scene: unknown) => void) => void;
}

// declare global {
//   interface Window {
//     obsstudio?: OBSBrowser;
//   }
// }

export const obsStudio = window.obsstudio;