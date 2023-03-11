import { exec } from "child_process";

/**
 * Replaces variables from the content and removes the variable mappings
 * @param content Content which has variables
 * @returns string Replaced content
 */
export function replaceVariables(content: string): string {
  let variableMap: Map<string, string> = new Map();
  let rawContentLines: string[] = [];
  content.split("\n").forEach((line) => {
    // parse the varible value
    if (line.indexOf("#") !== -1 && line.indexOf("=") !== -1) {
      let variableAndValue = line.split("#")[1];
      variableMap.set(
        variableAndValue.split("=")[0],
        variableAndValue.split("=")[1]
      );
    } else {
      rawContentLines.push(line);
    }
  });
  let rawContent = rawContentLines.join("\n");
  variableMap.forEach((value: string, key: string) => {
    rawContent = rawContent.replaceAll(`{{${key}}}`, value);
  });
  return rawContent;
}

/**
 * Generates the script to run the code
 * @param code code which needs to be executed
 * @param details extra details like language, org , configuration
 * @returns script to run the code
 */
export function getScriptToRunCode(code: string, details: any): string {
  let script = code;
  switch (details.language) {
    case "apex":
      script = `echo "${code}" | sfdx apex run -u ${details.org}`;
      break;
    case "soql":
      script = `sfdx data query -q "${code}" --target-org ${details.org}`;
      break;
    case "javascript":
      script = `echo "${code}" | node`;
      break;
      detault: script = code;
  }
  return script;
}

export async function isSandbox(org: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(
      `sfdx data query -q "SELECT IsSandbox FROM Organization LIMIT 1" --json --target-org ${org}`,
      (error: any, stdout: any, stderr: any) => {
        console.log(stderr);
        if (error !== null) {
          reject("Not able to identify if the org is sandbox or production");
        } else {
          let jsonData = JSON.parse(stdout);
          if (jsonData?.result?.records[0]) {
            resolve(jsonData?.result?.records[0].IsSandbox);
          } else {
            reject("Not able to identify if the org is sandbox or production");
          }
        }
      }
    );
  });
}
