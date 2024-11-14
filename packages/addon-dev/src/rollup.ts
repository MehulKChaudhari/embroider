import { default as hbs } from './rollup-hbs-plugin';
import { default as gjs } from './rollup-gjs-plugin';
import { default as publicEntrypoints } from './rollup-public-entrypoints';
import { default as appReexports } from './rollup-app-reexports';
import { default as keepAssets } from './rollup-keep-assets';
import { default as dependencies } from './rollup-addon-dependencies';
import {
  default as publicAssets,
  type PublicAssetsOptions,
} from './rollup-public-assets';
import { default as clean } from './rollup-incremental-plugin';
import type { Plugin } from 'rollup';

export class Addon {
  #srcDir: string;
  #destDir: string;

  constructor(params: { srcDir?: string; destDir?: string } = {}) {
    this.#srcDir = params.srcDir ?? 'src';
    this.#destDir = params.destDir ?? 'dist';
  }

  // Given a list of globs describing modules in your srcDir, this generates
  // corresponding appTree modules that contain reexports, and updates your
  // package.json metadata to list them all.
  appReexports(
    patterns: string[],
    opts: {
      mapFilename?: (fileName: string) => string;
      exports?: (filename: string) => string[] | string | undefined;
      exclude?: string[];
    } = {}
  ): Plugin {
    return appReexports({
      from: this.#srcDir,
      to: this.#destDir,
      include: patterns,
      mapFilename: opts.mapFilename,
      exports: opts.exports,
      exclude: opts.exclude,
    });
  }

  // This configures rollup to emit public entrypoints for each module in your
  // srcDir that matches one of the given globs. Typical addons will want to
  // match patterns like "components/**/*.js", "index.js", and "test-support.js".
  publicEntrypoints(patterns: string[], opts: { exclude?: string[] } = {}) {
    return publicEntrypoints({
      srcDir: this.#srcDir,
      include: patterns,
      exclude: opts.exclude,
    });
  }

  // This wraps standalone .hbs files as Javascript files using inline
  // templates. This means special resolving rules for .hbs files aren't
  // required for javascript tooling to understand your package.
  hbs(options = {}) {
    return hbs(options);
  }

  gjs() {
    return gjs();
  }

  // this does incremental updates to the dist files and also deletes files that are not part of the generated bundle
  // rollup already supports incremental transforms of files,
  // this extends it to the dist files
  clean() {
    return clean();
  }

  // V2 Addons are allowed to contain imports of .css files. This tells rollup
  // to leave those imports alone and to make sure the corresponding .css files
  // are kept in the same relative locations in the destDir as they were in the
  // srcDir.
  keepAssets(patterns: string[], exports?: undefined | 'default' | '*') {
    return keepAssets({
      from: this.#srcDir,
      include: patterns,
      exports: exports,
    });
  }

  // This is the default `output` configuration you should pass to rollup. We're
  // emitting ES modules, in your `destDir`, and their filenames are equal to
  // their bundle names (the bundle names get generated by `publicEntrypoints`
  // above).
  //
  // hoistTransitiveImports is disabled because the purpose of hoisting transitive imports
  // is to improve performance of apps loading modules.
  // Since v2 addons do not know exactly how they'll be used, this performance decision
  // is left up to apps.
  output() {
    return {
      dir: this.#destDir,
      entryFileNames: '[name]',
      experimentalMinChunkSize: 0,
      format: 'es',
      hoistTransitiveImports: false,
      sourcemap: true,
    };
  }

  dependencies() {
    return dependencies();
  }

  publicAssets(path: string, opts?: PublicAssetsOptions) {
    return publicAssets(path, opts);
  }
}
