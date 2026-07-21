import { spawn } from "node:child_process";

const input = process.argv.slice(2);
const output = [];
for (let index = 0; index < input.length; index += 1) {
  const argument = input[index];
  if (argument === "--host") output.push("--hostname", input[++index]);
  else if (argument !== "--strictPort") output.push(argument);
}

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...output], {
  stdio: "inherit",
});
child.on("exit", code => process.exit(code ?? 1));
