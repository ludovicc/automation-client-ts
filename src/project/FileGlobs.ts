/**
 * Glob pattern to match all files in a project. Standard glob syntax
 * @type {string}
 */
export const AllFiles = "**/**";

/**
 * Negative glob to exclude .git directory
 * @type {string}
 */
export const ExcludeGit = "!.git/**";

/**
 * Negative glob to exclude node_modules directory. We nearly always want to exclude
 * this when handling node projects, for performance reasons.
 * @type {string}
 */
export const ExcludeNodeModules = "!node_modules/**";

/**
 * Default exclusions (git and node modules).
 * Must be combined with a positive glob.
 * @type {[string , string]}
 */
export const DefaultExcludes = [ ExcludeGit, ExcludeNodeModules ];

/**
 * Include all files except with default exclusions (git and node modules)
 * @type {[string , string , string]}
 */
export const DefaultFiles = [ AllFiles ].concat(DefaultExcludes);
