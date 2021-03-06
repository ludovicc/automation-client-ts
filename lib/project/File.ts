import { ScriptedFlushable } from "../internal/common/Flushable";

/**
 * Operations common to all File interfaces
 */
export interface FileCore {

    /**
     * Return file name, excluding path
     *
     * @property {string} name
     */
    readonly name: string;

    /**
     * Return file path, with forward slashes
     *
     * @property {string} path
     */
    readonly path: string;

}

/**
 * @deprecated
 * Convenient way to defer File operations with fluent API
 */
export interface FileScripting extends ScriptedFlushable<File> {

}

export interface FileAsync extends FileCore {

    setContent(content: string): Promise<this>;

    rename(name: string): Promise<this>;

    getContent(): Promise<string>;

    replace(re: RegExp, replacement: string): Promise<this>;

    replaceAll(oldLiteral: string, newLiteral: string): Promise<this>;

    setPath(path: string): Promise<this>;

    isExecutable(): Promise<boolean>;

    isReadable(): Promise<boolean>;

    isBinary(): Promise<boolean>;

}

export interface FileNonBlocking extends FileScripting, FileAsync {

}

/**
 * Sychronous file operations. Use with care as they can limit concurrency.
 * Following the conventions of node fs library, they use a "sync" suffix.
 */
export interface FileSync extends FileCore {

    /**
     * Return content. Blocks: use inputStream by preference.
     *
     * @property {string} content
     */
    getContentSync(): string;

    setContentSync(content: string): this;

}

/**
 * Abstraction for a File. Similar to Project abstraction,
 * broken into three distinct styles of usage.
 */
export interface File extends FileScripting, FileSync, FileAsync {

    /**
     * Extension or the empty string if no extension can be determined
     */
    extension: string;

}

export function isFile(a: any): a is File {
    const maybeF = a as File;
    return !!maybeF.name && !!maybeF.path && !!maybeF.getContentSync;
}
