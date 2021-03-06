/*
 * Copyright © 2018 Atomist, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

export {
    ActionResult,
    successOn,
} from "./lib/action/ActionResult";
export {
    AtomistBuild,
    AtomistLinkImage,
    AtomistWebhookType,
    postAtomistWebhook,
    webhookBaseUrl,
} from "./lib/atomistWebhook";
export {
    automationClient,
} from "./lib/automationClient";
export {
    AnyOptions,
    BannerSection,
    Configuration,
    ConfigurationPostProcessor,
    configurationValue,
    defaultConfiguration,
    getUserConfig,
    invokePostProcessors,
    resolveWorkspaceIds,
    UserConfig,
    userConfigPath,
    writeUserConfig,
} from "./lib/configuration";
export {
    Secret,
    Secrets,
    MappedParameter,
    MappedParameters,
    Parameter,
    CommandHandler,
    ConfigurableCommandHandler,
    EventHandler,
    Parameters,
    Tags,
    Value,
} from "./lib/decorators";
export {
    automationClientInstance,
    eventStore,
} from "./lib/globals";
export { ApolloGraphClient } from "./lib/graph/ApolloGraphClient";
export {
    HandleCommand,
    SelfDescribingHandleCommand,
} from "./lib/HandleCommand";
export {
    EventFired,
    HandleEvent,
} from "./lib/HandleEvent";
export {
    AutomationContextAware,
    ConfigurationAware,
    HandlerContext,
    HandlerLifecycle,
} from "./lib/HandlerContext";
export {
    failure,
    Failure,
    FailurePromise,
    HandlerError,
    HandlerResult,
    RedirectResult,
    reduceResults,
    success,
    Success,
    SuccessPromise,
} from "./lib/HandlerResult";
export {
    obtainGitInfo,
} from "./lib/internal/env/gitInfo";
export {
    BaseParameter,
    declareMappedParameter,
    declareParameter,
    declareSecret,
} from "./lib/internal/metadata/decoratorSupport";
export {
    CommandInvocation,
} from "./lib/internal/invoker/Payload";
export {
    isCommandHandlerMetadata,
} from "./lib/internal/metadata/metadata";
export {
    metadataFromInstance,
} from "./lib/internal/metadata/metadataReading";
export {
    replacer,
} from "./lib/internal/transport/AbstractRequestProcessor";
export {
    CommandIncoming,
    EventIncoming,
    RequestProcessor,
} from "./lib/internal/transport/RequestProcessor";
export {
    RegistrationConfirmation,
} from "./lib/internal/transport/websocket/WebSocketRequestProcessor";
export {
    AutomationContext,
} from "./lib/internal/util/cls";
export {
    info,
} from "./lib/internal/util/info";
export {
    registerShutdownHook,
} from "./lib/internal/util/shutdown";
export {
    guid,
    toStringArray,
} from "./lib/internal/util/string";
export {
    EventHandlerMetadata,
    CommandHandlerMetadata,
} from "./lib/metadata/automationMetadata";
export {
    commandHandlerFrom,
    OnCommand,
} from "./lib/onCommand";
export {
    eventHandlerFrom,
    OnEvent,
} from "./lib/onEvent";
export {
    CommandDetails,
} from "./lib/operations/CommandDetails";
export {
    AbstractRemoteRepoRef,
} from "./lib/operations/common/AbstractRemoteRepoRef";
export {
    BitBucketRepoRef,
} from "./lib/operations/common/BitBucketRepoRef";
export {
    BitBucketServerRepoRef,
} from "./lib/operations/common/BitBucketServerRepoRef";
export {
    gitHubRepoLoader,
} from "./lib/operations/common/gitHubRepoLoader";
export {
    GitHubDotComBase,
    GitHubRepoRef,
    isGitHubRepoRef,
} from "./lib/operations/common/GitHubRepoRef";
export {
    EditorOrReviewerParameters,
} from "./lib/operations/common/params/BaseEditorOrReviewerParameters";
export {
    FallbackParams,
} from "./lib/operations/common/params/FallbackParams";
export {
    GitBranchRegExp,
    GitHubNameRegExp,
} from "./lib/operations/common/params/gitHubPatterns";
export {
    GitHubTargetsParams,
} from "./lib/operations/common/params/GitHubTargetsParams";
export {
    RemoteLocator,
} from "./lib/operations/common/params/RemoteLocator";
export {
    TargetsParams,
} from "./lib/operations/common/params/TargetsParams";
export {
    ProjectAction,
} from "./lib/operations/common/projectAction";
export {
    isTokenCredentials,
    ProjectOperationCredentials,
    TokenCredentials,
} from "./lib/operations/common/ProjectOperationCredentials";
export {
    andFilter,
    RepoFilter,
} from "./lib/operations/common/repoFilter";
export {
    RepoFinder,
} from "./lib/operations/common/repoFinder";
export {
    isRemoteRepoRef,
    RemoteRepoRef,
    RepoId,
    RepoRef,
    SimpleRepoId,
} from "./lib/operations/common/RepoId";
export {
    RepoLoader,
} from "./lib/operations/common/repoLoader";
export {
    doWithAllRepos,
} from "./lib/operations/common/repoUtils";
export {
    SourceLocation,
} from "./lib/operations/common/SourceLocation";
export {
    editAll,
} from "./lib/operations/edit/editAll";
export {
    BranchCommit,
    EditMode,
    isPullRequest,
    PullRequest,
} from "./lib/operations/edit/editModes";
export {
    AnyProjectEditor,
    EditResult,
    failedEdit,
    ProjectEditor,
    SimpleProjectEditor,
    successfulEdit,
    toEditor,
} from "./lib/operations/edit/projectEditor";
export {
    chainEditors,
    combineEditResults,
} from "./lib/operations/edit/projectEditorOps";
export {
    BaseSeedDrivenGeneratorParameters,
} from "./lib/operations/generate/BaseSeedDrivenGeneratorParameters";
export {
    generate,
    ProjectPersister,
} from "./lib/operations/generate/generatorUtils";
export {
    GitHubProjectPersister,
} from "./lib/operations/generate/gitHubProjectPersister";
export {
    GitHubRepoCreationParameters,
} from "./lib/operations/generate/GitHubRepoCreationParameters";
export {
    NewRepoCreationParameters,
} from "./lib/operations/generate/NewRepoCreationParameters";
export {
    RemoteGitProjectPersister,
} from "./lib/operations/generate/remoteGitProjectPersister";
export {
    RepoCreationParameters,
} from "./lib/operations/generate/RepoCreationParameters";
export {
    SeedDrivenGeneratorParameters,
} from "./lib/operations/generate/SeedDrivenGeneratorParameters";
export {
    addAtomistWebhook,
} from "./lib/operations/generate/support/addAtomistWebhook";
export {
    DefaultReviewComment,
    ProjectReview,
    ReviewComment,
    Severity,
} from "./lib/operations/review/ReviewResult";
export {
    DefaultTaggerTags,
    Tagger,
    TagRouter,
    TaggerTags,
} from "./lib/operations/tagger/Tagger";
export {
    File,
} from "./lib/project/File";
export {
    AllFiles,
} from "./lib/project/fileGlobs";
export {
    Fingerprint,
} from "./lib/project/fingerprint/Fingerprint";
export {
    Configurable,
} from "./lib/project/git/Configurable";
export {
    GitCommandGitProject,
} from "./lib/project/git/GitCommandGitProject";
export {
    GitProject,
    GitPushOptions,
} from "./lib/project/git/GitProject";
export {
    GitStatus,
} from "./lib/project/git/gitStatus";
export {
    isLocalProject,
    LocalProject,
    ReleaseFunction,
} from "./lib/project/local/LocalProject";
export {
    NodeFsLocalProject,
} from "./lib/project/local/NodeFsLocalProject";
export {
    InMemoryFile,
} from "./lib/project/mem/InMemoryFile";
export {
    InMemoryProject,
} from "./lib/project/mem/InMemoryProject";
export {
    FileStream,
    isProject,
    Project,
    ProjectAsync,
} from "./lib/project/Project";
export {
    AbstractProject,
} from "./lib/project/support/AbstractProject";
export {
    doWithJson,
} from "./lib/project/util/jsonUtils";
export {
    doWithMatches,
} from "./lib/project/util/parseUtils";
export {
    doWithFiles,
    fileExists,
    saveFromFiles,
    saveFromFilesAsync,
    toPromise,
} from "./lib/project/util/projectUtils";
export {
    isGitHubTeamMember,
} from "./lib/secured";
export {
    AutomationEventListener,
    AutomationEventListenerSupport,
} from "./lib/server/AutomationEventListener";
export {
    NoParameters,
    SmartParameters,
    ValidationError,
    ValidationResult,
} from "./lib/SmartParameters";
export {
    CloneOptions,
} from "./lib/spi/clone/DirectoryManager";
export {
    GraphClient,
    MutationOptions,
    QueryNoCacheOptions,
    QueryOptions,
} from "./lib/spi/graph/GraphClient";
export * from "./lib/spi/http/axiosHttpClient";
export * from "./lib/spi/http/curlHttpClient";
export * from "./lib/spi/http/httpClient";
export * from "./lib/spi/message/MessageClient";
export {
    DefaultSlackMessageClient,
    MessageClientSupport,
} from "./lib/spi/message/MessageClientSupport";
export {
    findFileMatches,
    findMatches,
    doWithAllMatches,
    findParser,
    findValues,
    gatherFromMatches,
    zapAllMatches,
} from "./lib/tree/ast/astUtils";
export {
    MatchResult,
} from "./lib/tree/ast/FileHits";
export {
    FileParser,
} from "./lib/tree/ast/FileParser";
export {
    FileParserRegistry,
} from "./lib/tree/ast/FileParserRegistry";
export {
    TypeScriptES6FileParser,
} from "./lib/tree/ast/typescript/TypeScriptFileParser";
export {
    Maker,
    toFactory,
} from "./lib/util/constructionUtils";
export * from "./lib/util/exec";
export {
    deepLink,
    fileContent,
    Issue,
    raiseIssue,
} from "./lib/util/gitHub";
export * from "./lib/util/logger";
export {
    scanFreePort,
} from "./lib/util/port";
export {
    doWithRetry,
} from "./lib/util/retry";
export * from "./lib/util/spawn";
import * as GraphQL from "./lib/graph/graphQL";
export { GraphQL };
import * as nsp from "./lib/internal/util/cls";
export { nsp };
