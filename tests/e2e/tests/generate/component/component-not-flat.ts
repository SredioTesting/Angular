import {join} from 'path';
import {ng} from '../../../utils/process';
import {expectFileToExist} from '../../../utils/fs';
import {updateJsonFile} from '../../../utils/project';


export default function() {
  // TODO:CONFIG READING
  return Promise.resolve();
  const componentDir = join('projects', 'test-project', 'src', 'app', 'test-component');

  return Promise.resolve()
    .then(() => updateJsonFile('.angular-cli.json', configJson => {
      const comp = configJson.defaults.component;
      comp.flat = false;
    }))
    .then(() => ng('generate', 'component', 'test-component'))
    .then(() => expectFileToExist(componentDir))
    .then(() => expectFileToExist(join(componentDir, 'test-component.component.ts')))
    .then(() => expectFileToExist(join(componentDir, 'test-component.component.spec.ts')))
    .then(() => expectFileToExist(join(componentDir, 'test-component.component.html')))
    .then(() => expectFileToExist(join(componentDir, 'test-component.component.css')))

    // Try to run the unit tests.
    .then(() => ng('test', '--watch=false'));
}
