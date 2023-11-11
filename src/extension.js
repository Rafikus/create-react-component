"use strict";
const vscode = require("vscode");
const utils = require("./utils");
const { logger, generators, getUsedCase } = utils;

function activate(context) {
  let createComponent = (uri, type) => {
    console.log("Create-react-component activated...");

    const configuredCase = vscode.workspace
      .getConfiguration("fancy-react-component-creator")
      .get("nameFileCase");
    const convertToCase = getUsedCase(configuredCase);

    new Promise((resolve) =>
      vscode.window
        .showInputBox({
          prompt: "Enter component name",
        })
        .then((inputValue) => resolve(inputValue))
    ).then((val) => {
      if (val.length === 0) {
        logger("error", "Component name can not be empty!");
        throw new Error("Component name can not be empty!");
      }

      vscode.window
        .showQuickPick(["Types", "Styles", "Tests"], {
          canPickMany: true,
          title: "Select files to create",
        })
        .then((selected) => {
          let componentName = convertToCase(val);
          let componentDir = generators.createComponentDir(uri, componentName);
          const promises = [];

          if (selected.includes("Types")) {
            promises.push(
              generators.createTypesFile(componentDir, componentName)
            );
          }

          if (selected.includes("Tests")) {
            promises.push(
              generators.createTestFile(componentDir, componentName)
            );
          }

          if (selected.includes("Styles")) {
            promises.push(generators.createSCSS(componentDir, componentName));
          }

          return Promise.all([
            ...promises,
            generators.createComponentFile(
              componentDir,
              componentName,
              type,
              ".tsx",
              selected
            ),
            generators.createIndexFile(
              componentDir,
              componentName,
              "index",
              ".ts"
            ),
          ]);
        })
        .then(
          () => logger("success", "React component successfully created!"),
          (err) => logger("error", err.message)
        );
    });
  };

  const componentsList = [
    {
      type: "functional",
      commandID: "extension.createReactFunctionalComponent",
    },
  ];

  componentsList.forEach((comp) => {
    let type = comp.type;
    let disposable = vscode.commands.registerCommand(comp.commandID, (uri) => {
      createComponent(uri, type);
    });
    context.subscriptions.push(disposable);
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
