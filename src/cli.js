import arg from 'arg';
import inquirer from 'inquirer';
import { createProject } from './main';

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--name': String,
      '--type': String,
      '--template': String,
      '-n': '--name',
      '-t': '--type',
      '-p': '--template'
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  return {
    name: args['--name'],
    type: args['--type'],
    template: args['--template'],
  };
}

async function promptForMissingOptions(options) {
  const defaultTemplate = 'JavaScript';
  const questions = [];
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Please choose which project template to use',
      choices: ['JavaScript', 'TypeScript'],
      default: defaultTemplate,
    });
  }

  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'Select type of component',
      choices: ['View', 'Component']
    });
  }

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Chooes name for a component.',
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter name.';
        }
      }
    });
  }

  const answers = await inquirer.prompt(questions);
  return {
    template: options.template || answers.template,
    name: options.name || answers.name,
    type: options.type || answers.type
  };
 }

export async function cli(args) {
  let options = parseArgumentsIntoOptions(args);
  options = await promptForMissingOptions(options);
  await createProject(options);
}
