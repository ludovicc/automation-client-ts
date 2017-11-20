import { Parameter } from "../../decorators";
import { HandlerContext } from "../../index";
import { Project } from "../../project/Project";
import { GitHubRepoRef } from "../common/GitHubRepoRef";
import { GitBranchRegExp, GitHubNameRegExp } from "../common/params/gitHubPatterns";
import { AbstractGenerator } from "./AbstractGenerator";

/**
 * Support for all seed-driven generators, which start with content
 * in a given repo.
 *
 * Defines common parameters.
 *
 */
export abstract class SeedDrivenGenerator extends AbstractGenerator {

    @Parameter({
        pattern: GitHubNameRegExp.pattern,
        displayName: "Seed Repository Owner",
        description: "owner, i.e., user or organization, of seed repository",
        validInput: GitHubNameRegExp.validInput,
        minLength: 1,
        maxLength: 50,
        required: false,
        displayable: false,
    })
    public sourceOwner: string;

    @Parameter({
        pattern: GitHubNameRegExp.pattern,
        displayName: "Seed Repository Name",
        description: "name of the seed repository",
        validInput: GitHubNameRegExp.validInput,
        minLength: 1,
        maxLength: 50,
        required: false,
        displayable: false,
    })
    public sourceRepo: string;

    @Parameter({
        pattern: GitBranchRegExp.pattern,
        displayName: "Seed Branch",
        description: "seed repository branch to clone for new project",
        validInput: GitBranchRegExp.validInput,
        minLength: 1,
        maxLength: 50,
        required: false,
        displayable: false,
    })
    public sourceBranch: string = "master";

    public startingPoint(ctx: HandlerContext, params: this): Promise<Project> {
        return this.repoLoader()(
            new GitHubRepoRef(this.sourceOwner, this.sourceRepo, this.sourceBranch));
    }

}
