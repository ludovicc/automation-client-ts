import * as path from "path";
import * as assert from "power-assert";

import { File } from "../../../lib/project/File";
import { AllFiles } from "../../../lib/project/fileGlobs";
import { InMemoryProject } from "../../../lib/project/mem/InMemoryProject";
import { toPromise } from "../../../lib/project/util/projectUtils";

describe("InMemoryProject", () => {

    describe("findFile", () => {

        it("findFileSync: existing file", () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = p.findFileSync("package.json");
            const c = f.getContentSync();
            assert(c === "{ node: true }");
        });

        it("findFileSync: no such file", () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = p.findFileSync("xxxxpackage.json");
            assert(f === undefined);
        });

        it("findFileSync: not return directory as file", () => {
            const p = InMemoryProject.of({ path: path.join("some", "dir", "file"), content: "x\n" });
            const f = p.findFileSync(path.join("some", "dir"));
            assert(f === undefined);
        });

        it("findFile: existing file", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = await p.findFile("package.json");
            const c = f.getContentSync();
            assert(c === "{ node: true }");
        });

        it("findFile: no such file", done => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            p.findFile("xxxxpackage.json")
                .then(() => assert.fail("should not have found xxxxpackage.json"), err => {
                    assert(err.message === "File not found at xxxxpackage.json");
                })
                .then(() => done(), done);
        });

        it("findFile: not return directory as file", done => {
            const d = path.join("some", "dir");
            const p = InMemoryProject.of({ path: path.join(d, "file"), content: "x\n" });
            p.findFile(d)
                .then(() => assert.fail("should not have found directory"), err => {
                    assert(err.message === `File not found at ${d}`);
                })
                .then(() => done(), done);
        });

    });

    describe("getFile", () => {

        it("getFile: existing file", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = await p.getFile("package.json");
            const c = await f.getContent();
            assert(c === "{ node: true }");
        });

        it("getFile: no such file", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = await p.getFile("xxxxpackage.json");
            assert(f === undefined);
        });

        it("getFile: not return directory", async () => {
            const d = path.join("some", "dir");
            const p = InMemoryProject.of({ path: path.join(d, "file"), content: "x\n" });
            const f = await p.getFile(d);
            assert(f === undefined);
        });

    });

    describe("hasFile", () => {

        it("should return true for existing file", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = await p.hasFile("package.json");
            assert(f === true);
        });

        it("should return false for non-existent file", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            const f = await p.hasFile("xxxxpackage.json");
            assert(f === false);
        });

        it("should return false for directory", async () => {
            const d = path.join("some", "dir");
            const p = InMemoryProject.of({ path: path.join(d, "file"), content: "x\n" });
            const f = await p.hasFile(d);
            assert(f === false);
        });

    });

    describe("hasDirectory", () => {

        it("should return true for existing directory", async () => {
            const fp = path.join("some", "dir", "file.ts");
            const p = InMemoryProject.of({ path: fp, content: "declare module;\n" });
            assert(await p.hasDirectory("some") === true);
            assert(await p.hasDirectory(path.join("some", "dir")) === true);
        });

        it("should return false for non-existent directory", async () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            assert(await p.hasDirectory("dir") === false);
        });

        it("should return false for file", async () => {
            const fp = path.join("some", "dir", "file.ts");
            const p = InMemoryProject.of({ path: fp, content: "declare module;\n" });
            assert(await p.hasDirectory(fp) === false);
        });

    });

    describe("fileExistsSync", () => {

        it("should find existing file", () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            assert(p.fileExistsSync("package.json") === true);
        });

        it("should not find non-existent file", () => {
            const p = InMemoryProject.of({ path: "package.json", content: "{ node: true }" });
            assert(p.fileExistsSync("xxxxpackage.json") === false);
        });

        it("should not find directory", () => {
            const d = path.join("some", "dir");
            const p = InMemoryProject.of({ path: path.join(d, "file"), content: "x\n" });
            assert(p.fileExistsSync(d) === false);
        });

    });

    describe("streamFiles", () => {

        it("files returns enough files", done => {
            const p = InMemoryProject.of(
                { path: "package.json", content: "{ node: true }" },
                { path: "package-lock.json", content: "{ node: true }" },
            );

            assert(toPromise(p.streamFiles())
                .then(files => {
                    assert(files.length === 2);
                    done();
                }).catch(done));
        });

        it("streamFiles returns enough files", done => {
            let count = 0;
            const p = InMemoryProject.of(
                { path: "package.json", content: "{ node: true }" },
                { path: "package-lock.json", content: "{ node: true }" },
            );
            p.streamFiles()
                .on("data", (f: File) => {
                    // console.log(`File path is [${f.path}]`);
                    assert(f.name);
                    count++;
                },
            ).on("end", () => {
                assert(count === 2);
                done();
            });
        });

        it("streamFiles excludes glob non-matches", done => {
            let count = 0;
            const p = InMemoryProject.of(
                { path: "config/thing.js", content: "{ node: true }" },
                { path: "config/other.ts", content: "{ node: true }" },
                { path: "notconfig/other.ts", content: "{ node: true }" },
            );
            p.streamFiles("config/**")
                .on("data", (f: File) => {
                    // console.log(`File path is [${f.path}]`);
                    assert(f.name);
                    count++;
                },
            ).on("end", () => {
                assert.equal(count, 2);
                done();
            });
        });

        it("streamFiles excludes .git by default", done => {
            let count = 0;
            const p = InMemoryProject.of(
                { path: "config/thing.js", content: "{ node: true }" },
                { path: "config/other.ts", content: "{ node: true }" },
                { path: "notconfig/other.ts", content: "{ node: true }" },
                { path: ".git/junk", content: "whatever" },
            );
            p.streamFiles(AllFiles)
                .on("data", (f: File) => {
                    // console.log(`File path is [${f.path}]`);
                    assert(f.name);
                    count++;
                },
            ).on("end", () => {
                assert.equal(count, 3);
                done();
            });
        });

        it("streamFiles excludes nested .git and node_modules by default", done => {
            let count = 0;
            const p = InMemoryProject.of(
                { path: "config/thing.js", content: "{ node: true }" },
                { path: "config/other.ts", content: "{ node: true }" },
                { path: "notconfig/other.ts", content: "{ node: true }" },
                { path: "nested/.git/junk", content: "whatever" },
                { path: "sub/project/node_modules/thing", content: "whatever" },
            );
            p.streamFiles(AllFiles)
                .on("data", (f: File) => {
                    // console.log(`File path is [${f.path}]`);
                    assert(f.name);
                    count++;
                },
            ).on("end", () => {
                assert.equal(count, 3);
                done();
            });
        });

        it("streamFiles respects negative globs", done => {
            let count = 0;
            const p = InMemoryProject.of(
                { path: "config/thing.js", content: "{ node: true }" },
                { path: "config/other.ts", content: "{ node: true }" },
                { path: "config/exclude.ts", content: "{ node: true }" },
            );
            p.streamFilesRaw(["config/**", "!**/exclude.*"], {})
                .on("data", (f: File) => {
                    // console.log(`File path is [${f.path}]`);
                    assert(f.name);
                    count++;
                },
            ).on("end", () => {
                assert.equal(count, 2);
                done();
            });
        });

        it("files returns well-known files", done => {
            const p = InMemoryProject.of(
                { path: "package.json", content: "{ node: true }" },
                { path: "package-lock.json", content: "{ node: true }" },
            );
            toPromise(p.streamFiles())
                .then(files => {
                    assert(files.some(f => f.name === "package.json"));
                    done();
                }).catch(done);
        });

        it("glob returns well-known file", done => {
            const p = InMemoryProject.of(
                { path: "package.json", content: "{ node: true }" },
                { path: "package-lock.json", content: "{ node: true }" },
            );
            toPromise(p.streamFiles("package.json"))
                .then(files => {
                    assert(files.some(f => f.name === "package.json"));
                    done();
                }).catch(done);
        });

    });

    it("file count", done => {
        const p = InMemoryProject.of(
            { path: "package.json", content: "{ node: true }" },
            { path: "package-lock.json", content: "{ node: true }" },
        );
        p.totalFileCount().then(num => {
            assert(num > 0);
            done();
        }).catch(done);
    }).timeout(5000);

    describe("addFile", () => {

        it("adds file", done => {
            const p = new InMemoryProject();
            p.recordAddFile("thing", "1");
            assert(!p.dirty);
            p.flush()
                .then(_ => {
                    const f2 = p.findFileSync("thing");
                    assert(f2);
                    done();
                }).catch(done);
        });

        it("adds nested file", done => {
            const p = new InMemoryProject();
            p.recordAddFile("config/thing", "1");
            assert(!p.dirty);
            p.flush()
                .then(_ => {
                    const f2 = p.findFileSync("config/thing");
                    assert(f2);
                    done();
                }).catch(done);
        });

        it("adds deeply nested file", done => {
            const p = new InMemoryProject();
            p.recordAddFile("config/and/more/thing", "1");
            assert(!p.dirty);
            p.flush()
                .then(_ => {
                    const f2 = p.findFileSync("config/and/more/thing");
                    assert(f2);
                    done();
                }).catch(done);
        });

    });

    describe("delete", () => {

        it("deletes file", done => {
            const p = new InMemoryProject();
            p.addFileSync("thing", "1");
            const f1 = p.findFileSync("thing");
            assert(f1.getContentSync() === "1");
            assert(!p.dirty);
            p.recordDeleteFile("thing");
            assert(p.dirty);
            p.flush()
                .then(_ => {
                    const f2 = p.findFileSync("thing");
                    assert(!f2);
                    done();
                }).catch(done);
        });

        const deleteTestFiles = [
            { path: "README.md", content: "# This project\n" },
            { path: "LICENSE", content: "The license.\n" },
            { path: "CODE_OF_CONDUCT.md", content: "The code.\n" },
            { path: "CONTRIBUTING.md", content: "Contribute.\n" },
            { path: "src/main/java/Command.java", content: "package main" },
            { path: ".travis/travis-build.bash", content: "#!/bin/bash\n" },
            { path: ".travis/some.patch", content: "--- a/c.d\n+++ b/c.d\n" },
            { path: "src/test/scala/CommandTest.scala", content: "package main" },
            { path: ".travis-save/travis-build.bash", content: "#!/bin/bash\necho save me\n" },
        ];
        const deleteTestDirs = [
            ".travis",
            ".travis-save",
            "src",
            "src/main",
            "src/main/java",
            "src/test",
            "src/test/scala",
        ];

        it("should sync delete a file", () => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md"];
            const remain = paths.filter(f => !remove.includes(f));
            remove.forEach(f => p.deleteFileSync(f));
            remain.forEach(f => assert(p.fileExistsSync(f)));
            remove.forEach(f => assert(!p.fileExistsSync(f)));
            deleteTestDirs.forEach(d => assert(p.directoryExistsSync(d)));
        });

        it("should async delete a file", done => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md"];
            const remain = paths.filter(f => !remove.includes(f));
            Promise.all(remove.map(f => p.deleteFile(f)))
                .then(() => {
                    remain.forEach(f => assert(p.fileExistsSync(f)));
                    remove.forEach(f => assert(!p.fileExistsSync(f)));
                    deleteTestDirs.forEach(d => assert(p.directoryExistsSync(d)));
                })
                .then(done, done);
        });

        it("should sync delete files", () => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md", ".travis/some.patch"];
            const remain = paths.filter(f => !remove.includes(f));
            remove.forEach(f => p.deleteFileSync(f));
            remain.forEach(f => assert(p.fileExistsSync(f)));
            remove.forEach(f => assert(!p.fileExistsSync(f)));
            deleteTestDirs.forEach(d => assert(p.directoryExistsSync(d)));
        });

        it("should async delete files", done => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md", ".travis/some.patch"];
            const remain = paths.filter(f => !remove.includes(f));
            Promise.all(remove.map(f => p.deleteFile(f)))
                .then(() => {
                    remain.forEach(f => assert(p.fileExistsSync(f)));
                    remove.forEach(f => assert(!p.fileExistsSync(f)));
                    deleteTestDirs.forEach(d => assert(p.directoryExistsSync(d)));
                })
                .then(done, done);
        });

        it("should sync delete a file and empty directories", () => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md", "src/main/java/Command.java"];
            const remain = paths.filter(f => !remove.includes(f));
            const removeDirs = ["src/main", "src/main/java"];
            const remainDirs = deleteTestDirs.filter(d => !removeDirs.includes(d));
            remove.forEach(f => p.deleteFileSync(f));
            remain.forEach(f => assert(p.fileExistsSync(f)));
            remove.forEach(f => assert(!p.fileExistsSync(f)));
            remainDirs.forEach(d => assert(p.directoryExistsSync(d)));
            removeDirs.forEach(d => assert(!p.directoryExistsSync(d)));
        });

        it("should async delete a file and empty directories", done => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const remove = ["CODE_OF_CONDUCT.md", "src/main/java/Command.java"];
            const remain = paths.filter(f => !remove.includes(f));
            const removeDirs = ["src/main", "src/main/java"];
            const remainDirs = deleteTestDirs.filter(d => !removeDirs.includes(d));
            Promise.all(remove.map(f => p.deleteFile(f)))
                .then(() => {
                    remain.forEach(f => assert(p.fileExistsSync(f)));
                    remove.forEach(f => assert(!p.fileExistsSync(f)));
                    remainDirs.forEach(d => assert(p.directoryExistsSync(d)));
                    removeDirs.forEach(d => assert(!p.directoryExistsSync(d)));
                })
                .then(done, done);
        });

        it("should sync delete a directory and its contents", () => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const removeDirs = [".travis"];
            const remainDirs = deleteTestDirs.filter(d => !removeDirs.includes(d));
            const remove = [".travis/travis-build.bash", ".travis/some.patch"];
            const remain = paths.filter(f => !remove.includes(f));
            removeDirs.forEach(d => p.deleteDirectorySync(d));
            remain.forEach(f => assert(p.fileExistsSync(f)));
            remove.forEach(f => assert(!p.fileExistsSync(f)));
            remainDirs.forEach(d => assert(p.directoryExistsSync(d)));
            removeDirs.forEach(d => assert(!p.directoryExistsSync(d)));
        });

        it("should async delete a file and empty directories", done => {
            const p = InMemoryProject.of(...deleteTestFiles);
            const paths = deleteTestFiles.map(f => f.path);
            const removeDirs = [".travis"];
            const remainDirs = deleteTestDirs.filter(d => !removeDirs.includes(d));
            const remove = [".travis/travis-build.bash", ".travis/some.patch"];
            const remain = paths.filter(f => !remove.includes(f));
            Promise.all(removeDirs.map(d => p.deleteDirectory(d)))
                .then(() => {
                    remain.forEach(f => assert(p.fileExistsSync(f)));
                    remove.forEach(f => assert(!p.fileExistsSync(f)));
                    remainDirs.forEach(d => assert(p.directoryExistsSync(d)));
                    removeDirs.forEach(d => assert(!p.directoryExistsSync(d)));
                })
                .then(done, done);
        });

    });

});
