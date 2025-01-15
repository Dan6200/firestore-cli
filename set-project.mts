import { Options } from "commander";
import { writeFile } from "fs/promises";
import ora from "ora";
import { ENV_INFO } from "./auth/file-paths.mjs";
import { createProject, getProject } from "./utils/google-cloud-config.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function setProject(projectId: string, options: Options) {
  try {
    if (!projectId) throw new Error("Must provide project ID");
    let project: any;
    if (options?.createProject) {
      // TODO: return project information save to a file
      project = await createProject(projectId, options);
      if (typeof projectId === "boolean") {
        CLI_LOG(
          `${projectId} is still being created...Wait briefly then retry with the exact same flags and arguments`
        );
        return;
      }
    } else {
      // TODO: retrieve project information and save to a file
      project = await getProject(projectId, options);
    }
    const spinner = ora(`Setting project ${projectId}...\n`).start();
    try {
      await writeFile(ENV_INFO, JSON.stringify(project));
      spinner.succeed(`Project ${projectId} set`);
    } catch (e) {
      CLI_LOG(e, "error");
      spinner.fail(`Failed to set project ${projectId}`);
    }
  } catch (e) {
    CLI_LOG(`Failed to set project ${projectId ?? ""}`, "error");
  }
}
