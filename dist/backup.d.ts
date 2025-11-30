import { SupportedDirectory } from './constants';
/**
 * Create timestamped backup for provided directories
 */
export declare function createBackup(targetPath: string, directories: SupportedDirectory[]): Promise<string | null>;
/**
 * Restore directories from backup snapshot
 */
export declare function rollbackSnapshot(targetPath: string, timestamp: string, directories: SupportedDirectory[]): Promise<string>;
//# sourceMappingURL=backup.d.ts.map