'use strict';
const vscode = require('vscode');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const { pascalCase, paramCase: kebabize } = require('change-case');

function logger(type, msg = '') {
  switch (type) {
    case 'success':
      return vscode.window.setStatusBarMessage(`Success: ${msg}`, 5000);
    case 'warning':
      return vscode.window.showWarningMessage(`Warning: ${msg}`);
    case 'error':
      return vscode.window.showErrorMessage(`Failed: ${msg}`);
  }
}

// const kebabize = (str) => str
//   .replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())


module.exports = {
  logger,
  generators: {
    templatesDir: path.join(__dirname, '/templates'),

    createFile: (file, data) =>
      new Promise(resolve => {
        let output = fse.outputFile(file, data);
        resolve(output);
      }),

    resolveWorkspaceRoot: path =>
      path.replace('${workspaceFolder}', vscode.workspace.rootPath),

    createComponentDir: function (uri, componentName) {
      let contextMenuSourcePath;

      if (uri && fs.lstatSync(uri.fsPath).isDirectory()) {
        contextMenuSourcePath = uri.fsPath;
      } else if (uri) {
        contextMenuSourcePath = path.dirname(uri.fsPath);
      } else {
        contextMenuSourcePath = vscode.workspace.rootPath;
      }

      let componentDir = `${contextMenuSourcePath}/${kebabize(componentName)}`;
      fse.mkdirsSync(componentDir);

      return componentDir;
    },

    createIndexFile: function (componentDir, compName, type, extension) {
      let templateFileName = this.templatesDir + `/${type}.template`;

      let componentContent = fs
        .readFileSync(templateFileName)
        .toString()
        .replace(/{componentNamePascal}/g, pascalCase(compName))
        .replace(/{componentNameKebab}/g, kebabize(compName));

      let filename = `${componentDir}/index${extension}`;

      return this.createFile(filename, componentContent);
    },

    createComponentFile: function (componentDir, compName, type, extension) {
      let templateFileName = this.templatesDir + `/${type}.template`;

      let componentContent = fs
        .readFileSync(templateFileName)
        .toString()
        .replace(/{componentNamePascal}/g, pascalCase(compName))
        .replace(/{componentNameKebab}/g, kebabize(compName));

      let filename = `${componentDir}/${kebabize(compName)}${extension}`;

      return this.createFile(filename, componentContent);
    },

    createInterfacesFile: function (componentDir, componentName) {
      return this.createComponentFile(componentDir, componentName, 'interfaces', '-interfaces.ts')
    },

    createTestFile: function (componentDir, componentName) {
      return this.createComponentFile(componentDir, componentName, 'test', '.test.tsx')
    },

    createSCSS: function (componentDir, componentName) {
      return this.createComponentFile(componentDir, componentName, 'sass', '.scss')
    }
  }
};
