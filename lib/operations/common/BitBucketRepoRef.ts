import axios from "axios";
import {
    ActionResult,
    successOn,
} from "../../action/ActionResult";

import { encode } from "../../internal/util/base64";
import { Configurable } from "../../project/git/Configurable";
import { logger } from "../../util/logger";
import { AbstractRemoteRepoRef } from "./AbstractRemoteRepoRef";
import { isBasicAuthCredentials } from "./BasicAuthCredentials";
import { ProjectOperationCredentials } from "./ProjectOperationCredentials";
import { ProviderType } from "./RepoId";

export const BitBucketDotComBase = "https://bitbucket.org/api/2.0";

export class BitBucketRepoRef extends AbstractRemoteRepoRef {

    constructor(owner: string,
                repo: string,
                sha: string = "master",
                public apiBase = BitBucketDotComBase,
                path?: string) {
        super(ProviderType.bitbucket_cloud, "https://bitbucket.org", apiBase, owner, repo, sha, path);
    }

    public createRemote(creds: ProjectOperationCredentials, description: string, visibility): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/repositories/${this.owner}/${this.repo}`;
        return axios.post(url, {
            scm: "git",
            is_private: visibility === "private",
        }, headers(creds))
            .then(axiosResponse => {
                return {
                    target: this,
                    success: true,
                    axiosResponse,
                };
            })
            .catch(error => {
                logger.error("Error attempting to create repository %j: %s", this, error);
                return Promise.resolve({
                    target: this,
                    success: false,
                    error,
                });
            });
    }

    public deleteRemote(creds: ProjectOperationCredentials): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/repositories/${this.owner}/${this.repo}`;
        logger.debug(`Making request to '${url}' to delete repo`);
        return axios.delete(url, headers(creds))
            .then(axiosResponse => {
                return {
                    target: this,
                    success: true,
                    axiosResponse,
                };
            })
            .catch(err => {
                logger.error("Error attempting to delete repository: " + err);
                return Promise.reject(err);
            });
    }

    public setUserConfig(credentials: ProjectOperationCredentials, project: Configurable): Promise<ActionResult<any>> {
        return Promise.resolve(successOn(this));
    }

    public raisePullRequest(credentials: ProjectOperationCredentials,
                            title: string, body: string, head: string, base: string): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/repositories/${this.owner}/${this.repo}/pullrequests`;
        logger.debug(`Making request to '${url}' to raise PR`);
        return axios.post(url, {
            title,
            description: body,
            source: {
                branch: {
                    name: head,
                },
            },
            destination: {
                branch: {
                    name: base,
                },
            },
        }, headers(credentials))
            .then(axiosResponse => {
                return {
                    target: this,
                    success: true,
                    axiosResponse,
                };
            })
            .catch(err => {
                logger.error(`Error attempting to raise PR. ${url} ${err}`);
                return Promise.reject(err);
            });
    }

}

function headers(creds: ProjectOperationCredentials) {
    if (!isBasicAuthCredentials(creds)) {
        throw new Error("Only Basic auth supported: Had " + JSON.stringify(creds));
    }
    const upwd = `${creds.username}:${creds.password}`;
    const encoded = encode(upwd);
    return {
        headers: {
            Authorization: `Basic ${encoded}`,
        },
    };
}
