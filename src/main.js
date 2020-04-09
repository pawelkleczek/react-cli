import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import replace from 'replace-in-file';

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
 return copy(options.templateDirectory, path.join(options.targetDirectory, options.name), {
   clobber: false,
 });
}

async function createDirectory(options) {
  const result = await execa('mkdir', [options.name], {
    cwd: options.targetDirectory,
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

async function adjustFileNames(options) {
  const fileExt = options.template === 'JavaScript' ? 'js' : 'tsx'
  const resultOne = await execa('mv', [`Component.${fileExt}`, `${options.name}.${fileExt}`], {
    cwd: path.join(options.targetDirectory, options.name),
  });
  const resultTwo = await execa('mv', ['Component.module.scss', `${options.name}.module.scss`], {
    cwd: path.join(options.targetDirectory, options.name),
  });
  if (resultOne.failed || resultTwo.failed) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

async function adjustNamesInFiles(options) {
  const fileExt = options.template === 'JavaScript' ? 'js' : 'ts'
  const x = fileExt === 'ts' ? 'x' : '';
  try {
    await replace({
      files: [
        path.join(options.targetDirectory, options.name, `${options.name}.${fileExt}${x}`),
        path.join(options.targetDirectory, options.name, `index.${fileExt}`),
      ],
      from: /Component/g,
      to: options.name
    })
  } catch (error) {
    return Promise.reject(new Error('Failed to initialize git'));
  }
  return;
}

export async function createProject(options) {
 options = {
   ...options,
   targetDirectory: path.join(process.cwd(), 'src', `${options.type.toLowerCase()}s`),
 };

 const currentFileUrl = import.meta.url;
 const templateDir = path.resolve(
   new URL(currentFileUrl).pathname,
   '../../templates',
   options.template.toLowerCase()
 );
 options.templateDirectory = templateDir;

 try {
   await access(templateDir, fs.constants.R_OK);
 } catch (err) {
   console.error('%s Invalid template name', chalk.red.bold('ERROR'));
   process.exit(1);
 }

 try {
   await access(options.targetDirectory, fs.constants.R_OK);
 } catch (err) {
   console.error('%s Invalid project structure', chalk.red.bold('ERROR'));
   process.exit(1);
 }

  const tasks = new Listr([
    {
      title: 'Create directory',
      task: () => createDirectory(options),
    },
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options),
    },
    {
      title: 'Change file names',
      task: () => adjustFileNames(options),
    },
    {
      title: 'Adjust names in files',
      task: () => adjustNamesInFiles(options),
    },
  ]);

 await tasks.run();
 console.log('%s Project ready', chalk.green.bold('DONE'));
 return true;
}
