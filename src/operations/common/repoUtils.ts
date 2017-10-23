import { HandlerContext } from "../../HandlerContext";
import { logger } from "../../internal/util/logger";
import { Project } from "../../project/Project";
import { allReposInTeam } from "./allReposInTeamRepoFinder";
import { defaultRepoLoader } from "./defaultRepoLoader";
import { AllRepos, RepoFilter } from "./repoFilter";
import { RepoFinder } from "./repoFinder";
import { RepoId } from "./RepoId";
import { RepoLoader } from "./repoLoader";

export interface Credentials {
    token?: string;
}

/**
 * Perform an action against all the given repos.
 * Skip over repos that cannot be loaded, logging a warning.
 * @param {HandlerContext} ctx
 * @param credentials credentials for repo finding and loading
 * @param action action parameter
 * @param parameters optional parameters
 * @param {RepoFinder} repoFinder
 * @param {} repoFilter
 * @param {RepoLoader} repoLoader
 * @return {Promise<R[]>}
 */
export function doWithAllRepos<R, P>(ctx: HandlerContext,
                                     credentials: Credentials,
                                     action: (p: Project, t: P) => Promise<R>,
                                     parameters: P,
                                     repoFinder: RepoFinder = allReposInTeam(),
                                     repoFilter: RepoFilter = AllRepos,
                                     repoLoader: RepoLoader =
                                         defaultRepoLoader(credentials.token)): Promise<R[]> {
    return relevantRepos(ctx, repoFinder, repoFilter)
        .then(ids =>
            Promise.all(
                ids.map(id =>
                    repoLoader(id)
                        .then(p => action(p, parameters))
                        .catch(err => {
                            logger.warn("Unable to load repo %s:%s: %s", id.owner, id.repo, err);
                            return undefined;
                        }),
                ),
            ).then(proms => proms.filter(prom => prom)),
        );
}

export function relevantRepos(ctx: HandlerContext,
                              repoFinder: RepoFinder = allReposInTeam(),
                              repoFilter: RepoFilter = AllRepos): Promise<RepoId[]> {
    return repoFinder(ctx)
        .then(rids =>
            Promise.all(rids.map(rid => Promise.resolve(repoFilter(rid))
                .then(relevant => relevant ? rid : undefined))));
}