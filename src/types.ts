import { SupportedDirectory } from './constants';

export interface DirectoryPlan {
  name: SupportedDirectory;
  source?: string;
  destination: string;
  added: string[];
  modified: string[];
  removed: string[];
}

export interface SyncOptions {
  target: string;
  repoUrl?: string;
  ref?: string;
  dryRun?: boolean;
  force?: boolean;
  remoteDir?: string;
  branch?: string;
}

export interface PushOptions {
  target: string;
  repoUrl?: string;
  branch?: string;
  remoteDir?: string;
  commitMessage?: string;
}