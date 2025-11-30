export interface GitResult {
    stdout: string;
    stderr: string;
}
/**
 * Run git command and return result
 */
export declare function runGit(args: string[], cwd?: string): Promise<GitResult>;
/**
 * Clone a repository with options
 */
export declare function cloneRepo(options: {
    repoUrl: string;
    destination: string;
    branch?: string;
    ref?: string;
    depth?: number;
}): Promise<void>;
/**
 * Get git repository root for a path
 */
export declare function getRepoRoot(path: string): Promise<string | null>;
/**
 * Check if directories have uncommitted changes
 */
export declare function hasUncommittedChanges(targetPath: string, directories: string[]): Promise<boolean>;
//# sourceMappingURL=git-utils.d.ts.map