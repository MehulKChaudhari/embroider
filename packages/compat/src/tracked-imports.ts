import { todo } from './messages';
import { Memoize } from 'typescript-memoize';
import { AddonMeta } from '@embroider/core';

export interface TrackedImport {
  assetPath: string;
  options: { type: string, outputFile: string | undefined };
}

export class TrackedImports {
  constructor(private packageName: string, private trackedImports: TrackedImport[]) {
  }

  @Memoize()
  get categorized(): { appJS: string[], appCSS: string[], testJS: string[], testCSS: string[] } {
    let appJS: string[] = [];
    let appCSS: string[] = [];
    let testJS: string[] = [];
    let testCSS: string[] = [];

    if (this.trackedImports) {
      this.trackedImports.forEach(({ assetPath, options }) => {
        let standardAssetPath = standardizeAssetPath(this.packageName, assetPath);
        if (!standardAssetPath) {
          return;
        }
        if (/\.js$/i.test(assetPath)) {
          if (options.type === 'vendor') {
            if (options.outputFile && options.outputFile !== '/assets/vendor.js') {
              todo(`${this.packageName} is app.importing vendor JS into a nonstandard output file ${options.outputFile}`);
            }
            appJS.push(standardAssetPath);
          } else if (options.type === 'test') {
            testJS.push(standardAssetPath);
          } else {
            todo(`${this.packageName} has a non-standard app.import type ${options.type} for asset ${assetPath}`);
          }
        } else if (/\.css$/i.test(assetPath)) {
          if (options.type === 'vendor') {
            if (options.outputFile && options.outputFile !== '/assets/vendor.css') {
              todo(`${this.packageName} is app.importing vendor CSS into a nonstandard output file ${options.outputFile}`);
            }
            appCSS.push(standardAssetPath);
          } else if (options.type === 'test') {
            testCSS.push(standardAssetPath);
          } else {
            todo(`${this.packageName} has a non-standard app.import type ${options.type} for asset ${assetPath}`);
          }
        }
      });
    }
    return { appJS, appCSS, testJS, testCSS };
  }

  get meta() {
    let result: AddonMeta = {
      version: 2
    };
    if (this.categorized.appJS.length > 0) {
      result['implicit-scripts'] = this.categorized.appJS.slice();
    }
    if (this.categorized.appCSS.length > 0) {
      result['implicit-styles'] = this.categorized.appCSS.slice();
    }
    if (this.categorized.testJS.length > 0) {
      result['implicit-test-scripts'] = this.categorized.testJS.slice();
    }
    if (this.categorized.testCSS.length > 0) {
      result['implicit-test-styles'] = this.categorized.testCSS.slice();
    }
    return result;
  }
}

function standardizeAssetPath(packageName: string, assetPath: string) {
  let [first, ...rest] = assetPath.split('/');
  if (first === 'vendor') {
    // our vendor tree is available via relative import
    return './vendor/' + rest.join('/');
  } else if (first === 'node_modules') {
    // our node_modules are allowed to be resolved directly
    return rest.join('/');
  } else {
    todo(`${packageName} app.imported from unknown path ${assetPath}`);
  }
}
