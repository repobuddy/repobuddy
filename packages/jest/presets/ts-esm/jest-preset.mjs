import nodejs from '../../configs/nodejs.mjs';
import tsEsm from '../../configs/ts-esm.mjs';
import watch from '../../configs/watch.mjs';

/** @type {import('jest').Config} */
export default {
  ...tsEsm,
  ...nodejs,
  ...watch
}

export { nodejs, tsEsm, watch };
