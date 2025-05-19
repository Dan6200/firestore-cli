import { Options } from "commander";
import { writeFile } from "fs/promises";
import ora from "ora";
import { ENV_INFO } from "./auth/file-paths.mjs";
import { createProject } from "./utils/google-cloud-api-config/projects/create.mjs";
import { getProject } from "./utils/google-cloud-api-config/projects/get.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function setProject(projectId: string, options: Options) {
  try {
    if (!projectId) throw new Error("Must provide project ID");
    let project: any;
    if (options?.createProject) {
      project = await createProject(projectId, options);
      if (typeof projectId === "boolean") {
        CLI_LOG(
          `${projectId} is still being created...Wait briefly then retry with the exact same flags and arguments`
        );
        return;
      }
    } else {
      project = await getProject(projectId, options);
    }
    const spinner = ora(`Setting project ${projectId}...\n`).start();
    try {
      await writeFile(ENV_INFO, JSON.stringify(project));
      spinner.succeed(`Project ${projectId} set`);
    } catch {
      spinner.fail(`Failed to write to file`);
    }
  } catch {
    CLI_LOG(`Failed to set project ${projectId ?? ""}`, "error");
    process.exit(1);
  }
}
