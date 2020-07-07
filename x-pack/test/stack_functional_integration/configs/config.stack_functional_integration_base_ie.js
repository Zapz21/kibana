/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { resolve } from 'path';
import buildState from './build_state';
import { ToolingLog } from '@kbn/dev-utils';
import chalk from 'chalk';

const reportName = 'Stack Functional Integration Tests';
const testsFolder = '../test/functional/apps';
const stateFilePath = '../../../../../integration-test/qa/envvars.sh';
const prepend = (testFile) => require.resolve(`${testsFolder}/${testFile}`);
const log = new ToolingLog({
  level: 'info',
  writeTo: process.stdout,
});

export default async ({ readConfigFile }) => {
  const defaultConfigs = await readConfigFile(require.resolve('../../functional/config'));
  const { servers } = defaultConfigs.getAll();
  const { tests, ...provisionedConfigs } = buildState(resolve(__dirname, stateFilePath));

  return {
    ...defaultConfigs.getAll(),
    junit: {
      reportName: `${reportName} - ${provisionedConfigs.VM}`,
    },
    browser: {
      type: 'ie',
    },
    servers,
    security: { disableTestUser: true },
    apps: {
      kibana: {
        pathname: '/app/kibana',
      },
      status_page: {
        pathname: '/status',
      },
      discover: {
        pathname: '/app/discover',
      },
      context: {
        pathname: '/app/discover',
        hash: '/context',
      },
      visualize: {
        pathname: '/app/visualize',
        hash: '/',
      },
      dashboard: {
        pathname: '/app/dashboards',
        hash: '/list',
      },
      // deprecated settings, use management
      settings: {
        pathname: '/app/management',
      },
      management: {
        pathname: '/app/management',
      },
      timelion: {
        pathname: '/app/timelion',
      },
      console: {
        pathname: '/app/dev_tools',
        hash: '/console',
      },
      home: {
        pathname: '/app/home',
        hash: '/',
      },
      sampledata: {
        pathname: '/app/home',
        hash: '/tutorial_directory/sampleData',
      },
    },
    stackFunctionalIntegrationTests: {
      envObj: provisionedConfigs,
    },
    testFiles: tests.map(prepend).map(logTest),
    // testFiles: ['monitoring'].map(prepend).map(logTest),
    // If we need to do things like disable animations, we can do it in configure_start_kibana.sh, in the provisioner...which lives in the integration-test private repo
    uiSettings: {},
  };
};

const splitRight = (re) => (testPath) => re.exec(testPath)[1];

function truncate(testPath) {
  const dropKibanaPath = splitRight(/^.+kibana[\\/](.*$)/gm);
  return dropKibanaPath(testPath);
}
function highLight(testPath) {
  const dropTestsPath = splitRight(/^.+test[\\/]functional[\\/]apps[\\/](.*)[\\/]/gm);
  const cleaned = dropTestsPath(testPath);
  const colored = chalk.greenBright.bold(cleaned);
  return testPath.replace(cleaned, colored);
}
function logTest(testPath) {
  log.info(`Testing: '${highLight(truncate(testPath))}'`);
  return testPath;
}
