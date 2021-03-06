import "mocha";
import * as path from "path";
import { logger } from "../../index";
import { spawnAndWatch } from "../../lib/util/spawn";

describe("spawned", () => {

    it("should kill long running job", done => {
        spawnAndWatch({
            command: "bash",
            args: [path.join(path.resolve(__dirname), "echo.sh")],
        },
            {
            },
            {
                write: what => logger.debug(what),
                log: "",
            },
            {
                timeout: 1000,
            })
            .then(() => done());
    });

});
