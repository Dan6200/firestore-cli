export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    // 1. Set encoding so 'chunk' is a string, not a Buffer
    process.stdin.setEncoding("utf-8");

    // 2. Handle data chunks
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    // 3. Handle the end of the stream
    process.stdin.on("end", () => {
      resolve(data.trim());
    });

    // 4. Handle errors
    process.stdin.on("error", (err) => {
      reject(err);
    });

    // 5. In some environments, you need to resume the stream manually
    if (process.stdin.isTTY) {
      // If it's a TTY and not a pipe, it might never "end"
      // You might want to resolve empty or handle differently
      resolve("");
    } else {
      process.stdin.resume();
    }
  });
}
