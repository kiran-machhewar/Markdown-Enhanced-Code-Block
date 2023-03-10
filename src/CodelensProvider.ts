import * as vscode from "vscode";
import { getScriptToRunCode } from "./MarkdownUtil";

/**
 * Codelense provider which finds the code blocks in the markdown files 
 * and provides commands to operate on those
 */
export class CodelensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /```([\s\S].[\s\S]*?[\s\S])```/g;
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

	/**
	 * Provides the code lenses for markdown code blocks	 
	 * @param document Current opened document
	 * @param token Cancellation Taken
	 * @returns vscode.CodeLens[] list of codelenses
	 */
  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const isMarkdownFile =
      vscode.window.activeTextEditor?.document.languageId === "markdown";
    if (isMarkdownFile) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const reg = new RegExp(/(.+)/g);
        let content: string = matches[0];
        let codeLines = content.split('\n');
        codeLines.splice(0,1);        
        let code = codeLines.join('\n').replace(/`/g, "");
        // Add Copy Command
        const line = document.lineAt(document.positionAt(matches.index).line);
        const copyPosition = new vscode.Position(line.lineNumber, 0);
        const copyRange = document.getWordRangeAtPosition(
          copyPosition,
          new RegExp(reg)
        );
        const copyCommand: vscode.Command = {
          title: "Copy",
          command: "markdown-copy-code.copycode",
          arguments: [code, false],
        };
        if (copyRange) {
          this.codeLenses.push(new vscode.CodeLens(copyRange, copyCommand));
        }
        
        // Add Run Code Command
        const runPosition = new vscode.Position(line.lineNumber, 5);
        let codeConfigs = content.split('\n')[0].replace(/`/g, "");        
        let details = {
          'position' : runPosition,
          'language' : codeConfigs.split('|')[0],
          'org':''
        };        
        if( ( details.language === 'apex' || 
            details.language === 'soql') && codeConfigs.split('|').length > 0) {
          details.org = codeConfigs.split('|')[1];          
        }
        
        if(details.language){
          code = getScriptToRunCode(code,details); 
        }      
        const runCommand: vscode.Command = {
          title: "Run",
          command: "markdown-copy-code.runcode",
          arguments: [code, details, false],
        };
        const runRange = document.getWordRangeAtPosition(
          runPosition,
          new RegExp(reg)
        );
        if (runRange) {
          this.codeLenses.push(new vscode.CodeLens(runRange, runCommand));
        }

        // Add Replace Variables Command
        if (content.indexOf("#") !== -1 && content.indexOf("=") !== -1) {
          const replacePosition = new vscode.Position(line.lineNumber, 8);
          const replaceCommand: vscode.Command = {
            title: "Replace Variables",
            command: "markdown-copy-code.replace-variables",
            arguments: [content, runPosition, false],
          };
          const replaceRanage = document.getWordRangeAtPosition(
            replacePosition,
            new RegExp(reg)
          );
          if (replaceRanage) {
            this.codeLenses.push(
              new vscode.CodeLens(replaceRanage, replaceCommand)
            );
          }
        }
      }
      return this.codeLenses;
    }
    return [];
  }
}
