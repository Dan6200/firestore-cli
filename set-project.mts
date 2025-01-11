import { Options } from "commander";
import { createProject } from "./enable-firestore.mjs";
import { getInput } from "./utils/interactive.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function setProject(projectIdArg: string, options: Options) {
  let projectId;
  try {
    if (options?.createProject) {
      const projectName =
        options?.projectName ?? (await getInput("Project Name"));
      projectId = await createProject(
        projectIdArg ?? (await getInput("Project ID")),
        projectName
      );
      if (typeof projectId === "boolean") {
        CLI_LOG(
          `${projectIdArg} is still being created...Wait briefly then retry with the exact same flags and arguments`
        );
        return;
      }
    } else {
      projectId = projectIdArg ?? (await getInput("Project ID"));
    }
  } catch (e) {
    CLI_LOG(`Failed to set project ${projectId ?? ""}`, "error");
  }
}
