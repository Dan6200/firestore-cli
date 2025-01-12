import { Options } from "commander";
import { createProject } from "./utils/google-cloud-config.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function setProject(projectId: string, options: Options) {
  try {
    if (!projectId) throw new Error("Must provide project ID");
    if (options?.createProject) {
      const projectName = options?.projectName;
      //
      if (!projectName) throw new Error("Must provide project Name");
      await createProject(projectId, projectName);
      if (typeof projectId === "boolean") {
        CLI_LOG(
          `${projectId} is still being created...Wait briefly then retry with the exact same flags and arguments`
        );
        return;
      }
    } else {
    }
  } catch (e) {
    CLI_LOG(`Failed to set project ${projectId ?? ""}`, "error");
  }
}
