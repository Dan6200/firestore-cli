import { existsSync, readdirSync } from "fs";

export function handleSecretKey(secretKey: string | null) {
  if (!secretKey) {
    if (!existsSync("./service-account"))
      throw new Error(
        "Must Provide A Service-account Key File To Authenticate!\n       Either provide the file path as an argument to the option '--service-account' or include a directory named 'service-account' with the secret key file in it."
      );
    const secretKeyDir = readdirSync("./service-account");
    const file = secretKeyDir.find((file) => file.endsWith(".json"));
    if (!file)
      throw new Error(
        "Your service-account directory does not contain the JSON key file!\n       Either provide the file path as an argument to the option '--service-account' or include a directory named 'service-account' with the secret key file in it."
      );
    return "./service-account/" + file;
  }
  if (!existsSync(secretKey))
    throw new Error("Secret-key file path does not exist!");
  return secretKey;
}
