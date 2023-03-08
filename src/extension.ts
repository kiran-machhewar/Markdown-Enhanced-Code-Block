// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { TextEncoder } from "util";
import * as vscode from "vscode";
import { replaceVariables } from "./MarkdownUtil";
import { CodelensProvider } from "./CodelensProvider";

// extensions is activated whennever a markdown file is opened in the editor
export function activate(context: vscode.ExtensionContext) {
  const codelensProvider = new CodelensProvider();  
  // Register the codelense provider
  vscode.languages.registerCodeLensProvider("*", codelensProvider);

	// handle markdown-copy-code.copycode command
  vscode.commands.registerCommand(
    "markdown-copy-code.copycode",
    async (content: any) => {
      await vscode.env.clipboard.writeText(`${content}`);
      vscode.window.showInformationMessage(`Copy is successful.`);
    }
  );

	// handle markdown-copy-code.runcode command
  vscode.commands.registerCommand(
    "markdown-copy-code.runcode",
    async (content: any, position: vscode.Position) => {
      let terminal: any = vscode.window.activeTerminal;
      if (!terminal) {
        terminal = await vscode.window.createTerminal("Code Runner");
      }
      terminal.show();
      terminal.sendText(`${content}`);
    }
  );

	// handle markdown-copy-code.replace-variables command
  vscode.commands.registerCommand(
    "markdown-copy-code.replace-variables",
    async (content: string, position: vscode.Position) => {      
      let currentDocumentURI = vscode.window.activeTextEditor?.document.uri;
      if (currentDocumentURI) {
        content = replaceVariables(content);
        console.log("currentDocumentURI", currentDocumentURI.path);
        let textEncoder: TextEncoder = new TextEncoder();
        if (vscode.workspace.workspaceFolders) {
          let tempFileUri = vscode.Uri.file(
            vscode.workspace.workspaceFolders[0]?.uri.fsPath +
              "/markdown-copy-temp.md"
          );
          vscode.workspace.fs.writeFile(
            tempFileUri,
            textEncoder.encode(content)
          );
          console.log("File is written");
          // show the code
          let location = new vscode.Location(
            tempFileUri,
            new vscode.Position(0, 0)
          );
          await vscode.commands.executeCommand(
            "editor.action.peekLocations",
            currentDocumentURI,
            position,
            [location],
            "peek"
          );
        }
      }
    }
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
