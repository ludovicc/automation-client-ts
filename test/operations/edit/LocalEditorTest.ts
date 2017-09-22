import * as fs from "fs";
import "mocha";
import * as assert from "power-assert";
import { EditResult, ProjectEditor } from "../../../src/operations/edit/projectEditor";
import { tempProject } from "../../project/utils";

describe("Local editing", () => {

    it("should not edit with no op editor", done => {
        const project = tempProject();
        const editor: ProjectEditor<EditResult> = p => Promise.resolve({ edited: false });
        editor(null, project)
            .then(r => {
                assert(!r.edited);
                done();
            });
    });

    it("should edit on disk with real editor", done => {
        const project = tempProject();
        const editor: ProjectEditor<EditResult> = (id, p) => {
            p.addFileSync("thing", "1");
            return Promise.resolve({ edited: true });
        };
        editor(null, project)
            .then(r => {
                assert(r.edited);
                // Reload project
                assert(fs.statSync(project.baseDir + "/thing").isFile());
                done();
            });
    });

});
