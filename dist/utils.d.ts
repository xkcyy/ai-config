/**
 * Calculate SHA-256 hash of a file
 */
export declare function hashFile(filePath: string): Promise<string>;
/**
 * Create a snapshot of directory with file hashes
 */
export declare function snapshotDirectory(dirPath: string): Promise<Record<string, string>>;
/**
 * Get list of all files in directory recursively
 */
export declare function getAllFiles(dirPath: string): Promise<string[]>;
/**
 * Get relative paths of all files in directory
 */
export declare function snapshotPathsOnly(dirPath: string): Promise<string[]>;
/**
 * Normalize remote directory path
 */
export declare function normalizeRemoteDir(remoteDir: string): string;
//# sourceMappingURL=utils.d.ts.map