import fs from 'fs';
import mockConsole from 'jest-mock-console';
import path from 'path';
import globby from 'globby';
import consola from 'consola';
import slicemachine from '../../lib/commands/slicemachine';

describe('slice machine commands', () => {
  describe('help', () => {
    it('should be called by default', () => {
      const restoreConsole = mockConsole();

      const context = { SliceMachine: {} };

      slicemachine(context);

      expect(console.log).toHaveBeenCalled();

      restoreConsole();
    });
  });

  describe('ls', () => {
    const context = { SliceMachine: { ls: true } };

    it('should list libaries from...', async () => {
      jest.mock('fs');

      fs.existsSync = jest.fn();
      fs.existsSync.mockReturnValue(true);


      jest.mock('globby');
      globby.sync = jest.fn();
      globby.sync.mockReturnValue([
        path.resolve(__dirname, '../../node_modules/', 'vue-essential-slices/src/slices/CallToAction/model.json'),
      ]);

      const mockSMConfig = {
        // pathToSlices,
        // isLocal,
        libraries: [
          '@/slices',
          'vue-essential-slices',
        ],
      };

      fs.readFileSync = jest.fn();
      fs.readFileSync.mockReturnValue(JSON.stringify(mockSMConfig));

      jest.mock('console');
      console.error = jest.fn();
      console.log = jest.fn();

      consola.mockTypes(typeName => (typeName === 'info' && jest.fn()));

      const libs = await slicemachine(context);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
      expect(consola.info).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled(); // maybe match snapshot?

      expect(libs).toMatchSnapshot();


      jest.unmock('fs');
      jest.unmock('globby');
      jest.unmock('console');
    });
  });
});


/** 'steup/init'
 * Frameworks get checks package.json for next or nuxt.
 * 
 * >downloads zip http://sm-api-p1g4hvtof.vercel.app/api/bootstrap?framework=nuxt
 * 
 * unzips and checks path to zip
 * 
 * exicutes the commands in either boot.json of bootstrap.json
 * 
 * boot.json should be the file to call
 * 
 * create a prismic repository with the custom types returned by the api.
 * 
 * an info object is returned by an internal function
 * 
 * installs dependancies
 * 
 * creates sm.json (a file that contains api endpoint, and an array of libraries that are used)
 * {
 *  "libraries": ["@/slices", "vue-essential-slices"],
 *  "apiEndpoint": "http://shared.wroom.test/api/v2",
 *  "dbId": "prismicio-94fce09d-e85f-4dc2-bf68-eacd2f5c2ad3_5"
 * }
 *
 * writes out the files from mainifest?
 * 
 ** handleRecap
 * > generates config
 * > transform config
 * > generates a display stating what needs to be done next
 * */

/** create-slice
  * creates a slice in the project.
  * 
  * > gets the framework
  * > reads sm.json looking for local libaries/directories or creates one for the slice.
  * > asks for slice name
  * > creates a remote slice
  * > creates a local slice
*/ 

/** Pull
  * gets custom-types
  * get the slice zones for custom types
  * gets all the model locally
  *
  * Diffs localfiles and remote files.
  * creates missing slices
  * prompts user about conflicting slices.
* */


