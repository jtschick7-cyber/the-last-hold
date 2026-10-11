// Technical design §11.3: every build knows its channel, version, branch and commit,
// so About can show exactly what the owner is playtesting.
export type Channel = 'live' | 'preview';

export interface BuildInfo {
  channel: Channel;
  version: string;
  commit: string;
  branch: string;
  builtAt: string;
}

export const buildInfo: BuildInfo = __BUILD_INFO__;
