import Helpers from '../../helpers';
import Sentry from '../../services/sentry';

export default {
  filterZipEntries(filePaths, zipFile) {
    return zipFile.getEntries().filter((e) => (
      filePaths.reduce((acc, filePath) => acc || e.entryName === filePath, false)
    ));
  },

  extractTo(entries, destinationPath, zipFile) {
    entries.forEach((entry) => {
      try {
        zipFile.extractEntryTo(entry.entryName, destinationPath, /* maintainEntryPath */ true);
      } catch (e) {
        Sentry.report(e);
        Helpers.UI.displayErrors(`Failed to insert this file: ${entry.entryName} ${e}`);
      }
    });
  },
  mergeInto(entries, destinationPath, zipFile) {
    entries.forEach((entry) => {
      try {
        zipFile.extractEntryTo(entry.entryName, destinationPath, /* maintainEntryPath */ true, /* overwrite */ true);
      } catch (e) {
        Sentry.report(e);
        Helpers.UI.displayErrors(`Failed to insert this file: ${entry.entryName}`);
      }
    });
  },
};
