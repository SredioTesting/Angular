import * as assign from 'lodash/assign';
import * as denodeify from 'denodeify';
const Command = require('../ember-cli/lib/models/command');
const SilentError = require('silent-error');
const PortFinder = require('portfinder');
const chalk = require('chalk');
import ServeWebpackTask from '../tasks/serve-webpack';

PortFinder.basePort = 49152;

const getPort = <any>denodeify(PortFinder.getPort);
const defaultPort = process.env.PORT || 4200;

export interface ServeTaskOptions {
  port?: number;
  host?: string;
  proxyConfig?: string;
  watcher?: string;
  liveReload?: boolean;
  liveReloadHost?: string;
  liveReloadPort?: number;
  liveReloadBaseUrl?: string;
  liveReloadLiveCss?: boolean;
  target?: string;
  environment?: string;
  ssl?: boolean;
  sslKey?: string;
  sslCert?: string;
  aot?: boolean;
  sourcemap?: boolean;
  verbose?: boolean;
  progress?: boolean;
  open?: boolean;
  vendorChunk?: boolean;
  hmr?: boolean;
}

const ServeCommand = Command.extend({
  name: 'serve',
  description: 'Builds and serves your app, rebuilding on file changes.',
  aliases: ['server', 's'],

  availableOptions: [
    { name: 'port',                 type: Number,  default: defaultPort,   aliases: ['p'] },
    {
      name: 'host',
      type: String,
      default: 'localhost',
      aliases: ['H'],
      description: 'Listens only on localhost by default'
    },
    { name: 'proxy-config',         type: 'Path',                          aliases: ['pc'] },
    { name: 'watcher',              type: String,  default: 'events',      aliases: ['w'] },
    { name: 'live-reload',          type: Boolean, default: true,          aliases: ['lr'] },
    {
      name: 'live-reload-host',
      type: String,
      aliases: ['lrh'],
      description: 'Defaults to host'
    },
    {
      name: 'live-reload-base-url',
      type: String,
      aliases: ['lrbu'],
      description: 'Defaults to baseURL'
    },
    {
      name: 'live-reload-port',
      type: Number,
      aliases: ['lrp'],
      description: '(Defaults to port number within [49152...65535])'
    },
    {
      name: 'live-reload-live-css',
      type: Boolean,
      default: true,
      description: 'Whether to live reload CSS (default true)'
    },
    {
      name: 'target',
      type: String,
      default: 'development',
      aliases: ['t', { 'dev': 'development' }, { 'prod': 'production' }]
    },
    { name: 'environment',          type: String,  default: '', aliases: ['e'] },
    { name: 'ssl',                  type: Boolean, default: false },
    { name: 'ssl-key',              type: String,  default: 'ssl/server.key' },
    { name: 'ssl-cert',             type: String,  default: 'ssl/server.crt' },
    { name: 'aot',                  type: Boolean, default: false },
    { name: 'sourcemap',            type: Boolean, default: true, aliases: ['sm'] },
    { name: 'vendor-chunk',         type: Boolean, default: true },
    { name: 'verbose',              type: Boolean, default: false },
    { name: 'progress',             type: Boolean, default: true },
    {
      name: 'open',
      type: Boolean,
      default: false,
      aliases: ['o'],
      description: 'Opens the url in default browser',
    },
    {
      name: 'hmr',
      type: Boolean,
      default: false,
      description: 'Enable hot module replacement',
    },
  ],

  run: function(commandOptions: ServeTaskOptions) {
    if (commandOptions.environment === '') {
      if (commandOptions.target === 'development') {
        commandOptions.environment = 'dev';
      }
      if (commandOptions.target === 'production') {
        commandOptions.environment = 'prod';
      }
    }

    commandOptions.liveReloadHost = commandOptions.liveReloadHost || commandOptions.host;

    return this._checkExpressPort(commandOptions)
      .then(this._autoFindLiveReloadPort.bind(this))
      .then((opts: ServeTaskOptions) => {
        commandOptions = assign({}, opts, {
          baseURL: this.project.config(commandOptions.target).baseURL || '/'
        });

        const serve = new ServeWebpackTask({
          ui: this.ui,
          analytics: this.analytics,
          project: this.project,
        });

        return serve.run(commandOptions);
      });
  },

  _checkExpressPort: function(commandOptions: ServeTaskOptions) {
    return getPort({ port: commandOptions.port, host: commandOptions.host })
      .then((foundPort: number) => {

        let chosenPort = commandOptions.port;

        // user specified the port
        if (chosenPort !== defaultPort && chosenPort !== foundPort && chosenPort !== 0) {
          throw new SilentError(`Port ${chosenPort} is already in use.`);
        }

        // default port was already in use
        if (chosenPort !== foundPort ) {
          let line = `Port ${chosenPort} is already in use. Using port ${foundPort} instead.`;
          this.ui.writeLine(chalk.yellow(line));
        }

        // use found port
        commandOptions.port = foundPort;
        return commandOptions;

      });
  },

  _autoFindLiveReloadPort: function(commandOptions: ServeTaskOptions) {
    return getPort({ port: commandOptions.liveReloadPort, host: commandOptions.liveReloadHost })
      .then((foundPort: number) => {

        // if live reload port matches express port, try one higher
        if (foundPort === commandOptions.port) {
          commandOptions.liveReloadPort = foundPort + 1;
          return this._autoFindLiveReloadPort(commandOptions);
        }

        // port was already open
        if (foundPort === commandOptions.liveReloadPort) {
          return commandOptions;
        }

        // use found port as live reload port
        commandOptions.liveReloadPort = foundPort;
        return commandOptions;

      });
  }
});

export default ServeCommand;
