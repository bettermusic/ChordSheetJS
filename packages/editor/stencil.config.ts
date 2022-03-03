import { Config } from '@stencil/core';

import { postcss } from '@stencil/postcss';

import autoprefixer from 'autoprefixer';

export const config: Config = {
  namespace: 'editor',
  taskQueue: 'async'
,
  plugins: [
          postcss({
            plugins: [autoprefixer()]
          })
          ]
,
  outputTargets: [{
        type: 'dist',
        esmLoaderPath: '../loader',
        dir: '../../dist/packages/editor/dist',
      },{
        type: 'www',
        dir: '../../dist/packages/editor/www',
        serviceWorker: null // disable service workers
      }]

,
};
