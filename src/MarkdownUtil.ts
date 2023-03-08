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
