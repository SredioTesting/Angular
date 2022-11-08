/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Rule, SchematicsException } from '@angular-devkit/schematics';

import { generateFromFiles } from '../utility/generate-from-files';

import { Implement as GuardInterface, Schema as GuardOptions } from './schema';

export default function (options: GuardOptions): Rule {
  if (options.implements && options.implements.length > 0 && options.guardType) {
    throw new SchematicsException('Options "implements" and "guardType" cannot be used together.');
  }

  if (options.guardType) {
    const guardType = options.guardType.replace(/^can/, 'Can') + 'Fn';

    return generateFromFiles({ ...options, templateFilesDirectory: './type-files' }, { guardType });
  } else {
    if (!options.implements || options.implements.length < 1) {
      options.implements = [GuardInterface.CanActivate];
    }

    const implementations = options.implements
      .map((implement) => (implement === 'CanDeactivate' ? 'CanDeactivate<unknown>' : implement))
      .join(', ');
    const commonRouterNameImports = ['ActivatedRouteSnapshot', 'RouterStateSnapshot'];
    const routerNamedImports: string[] = [...options.implements, 'UrlTree'];

    if (
      options.implements.includes(GuardInterface.CanLoad) ||
      options.implements.includes(GuardInterface.CanMatch)
    ) {
      routerNamedImports.push('Route', 'UrlSegment');

      if (options.implements.length > 1) {
        routerNamedImports.push(...commonRouterNameImports);
      }
    } else {
      routerNamedImports.push(...commonRouterNameImports);
    }

    routerNamedImports.sort();

    const routerImports = routerNamedImports.join(', ');

    return generateFromFiles(
      { ...options, templateFilesDirectory: './implements-files' },
      {
        implementations,
        routerImports,
      },
    );
  }
}
