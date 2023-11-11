"use strict";
const vscode = require("vscode");
const fse = require("fs-extra");
const fs = require("fs");
const path = require("path");
const changeCase = require("change-case");

function slash() {
  return process.platform === "win32" ? "\\" : "/";
}

function logger(type, msg = "") {
  switch (type) {
    case "success":
      return vscode.window.setStatusBarMessage(`Success: ${msg}`, 5000);
    case "warning":
      return vscode.window.showWarningMessage(`Warning: ${msg}`);
    case "error":
      return vscode.window.showErrorMessage(`Failed: ${msg}`);
    default:
      return vscode.window.showInformationMessage(`${msg}`);
  }
}

const getUsedCase = (configuredCase) => {
  switch (configuredCase) {
    case "camelCase":
      return changeCase.camelCase;
    case "PascalCase":
      return changeCase.pascalCase;
    case "snake_case":
      return changeCase.snakeCase;
    case "kebab-case":
      return changeCase.kebabCase;
    case "CONSTANT_CASE":
      return changeCase.constantCase;
    default:
      return (value) => value;
  }
};

module.exports = {
  getUsedCase,
  logger,
  generators: {
    templatesDir: path.join(__dirname, `${slash()}templates`),

    createFile: (file, data) =>
      new Promise((resolve) => {
        let output = fse.outputFile(file, data);
        resolve(output);
      }),

    resolveWorkspaceRoot: (path) =>
      path.replace("${workspaceFolder}", vscode.workspace.rootPath),

    createComponentDir: function (uri, componentName) {
      const configuredCase = vscode.workspace
        .getConfiguration("fancy-react-component-creator")
        .get("nameFileCase");
      const convertToCase = getUsedCase(configuredCase);
      let contextMenuSourcePath;

      if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
        contextMenuSourcePath = uri.fsPath;
      } else if (uri) {
        contextMenuSourcePath = path.dirname(uri.fsPath);
      } else {
        contextMenuSourcePath = vscode.workspace.rootPath;
      }

      let componentDir = `${contextMenuSourcePath}/${convertToCase(
        componentName
      )}`;
      fse.mkdirsSync(componentDir);

      return componentDir;
    },

    createIndexFile: function (componentDir, compName, type, extension) {
      const configuredCase = vscode.workspace
        .getConfiguration("fancy-react-component-creator")
        .get("nameFileCase");
      const convertToCase = getUsedCase(configuredCase);
      let templateFileName = this.templatesDir + `${slash()}${type}.template`;

      let componentContent = fs
        .readFileSync(templateFileName)
        .toString()
        .replace(/{componentNamePascal}/g, changeCase.pascalCase(compName))
        .replace(/{componentNameKebab}/g, convertToCase(compName));

      let filename = `${componentDir}${slash()}index${extension}`;

      return this.createFile(filename, componentContent);
    },

    createComponentFile: function (
      componentDir,
      compName,
      type,
      extension,
      selected
    ) {
      const configuredCase = vscode.workspace
        .getConfiguration("fancy-react-component-creator")
        .get("nameFileCase");
      const convertToCase = getUsedCase(configuredCase);
      let templateFileName = this.templatesDir + `${slash()}${type}.template`;

      let componentContent = fs
        .readFileSync(templateFileName)
        .toString()
        .replace(
          /\n{typesImport}/g,
          selected?.includes("Types")
            ? `import { {componentNamePascal}Props } from './{componentNameKebab}-interfaces';`
            : ""
        )
        .replace(
          /\n{styleImport}/g,
          selected?.includes("Styles")
            ? `import './{componentNameKebab}.scss';`
            : ""
        )
        .replace(
          /{styleClassName}/g,
          selected?.includes("Styles")
            ? `className="{componentNameKebab}-wrapper"`
            : ""
        )
        .replace(/{componentNamePascal}/g, changeCase.pascalCase(compName))
        .replace(/{componentNameKebab}/g, convertToCase(compName));

      let filename = `${componentDir}${slash()}${convertToCase(
        compName
      )}${extension}`;

      return this.createFile(filename, componentContent);
    },

    createTypesFile: function (componentDir, componentName) {
      return this.createComponentFile(
        componentDir,
        componentName,
        "types",
        "-types.ts"
      );
    },

    createTestFile: function (componentDir, componentName) {
      return this.createComponentFile(
        componentDir,
        componentName,
        "test",
        ".test.tsx"
      );
    },

    createSCSS: function (componentDir, componentName) {
      return this.createComponentFile(
        componentDir,
        componentName,
        "sass",
        ".scss"
      );
    },
  },
};
