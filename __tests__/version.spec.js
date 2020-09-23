import fetchMock from 'jest-fetch-mock';
import semver from 'semver';

import { isSameVersionOrHigher, fetchRemotePackage, checkVersion } from '../lib/commands/version';
import currentPackage from '../package.json';


describe('version.js', () => {
  describe('#isSameVersionOrHigher', () => {
    it('should return true when local and remote are equal', () => {
      const local = { version: '0.0.1' };
      const remote = { versions: { '0.0.1': {} } };
      expect(isSameVersionOrHigher(local, remote)).toBe(true);
    });

    it('should return true when the local version is higher than the remote', () => {
      const local = { version: '0.0.2' };
      const remote = { versions: { '0.0.1': {} } };
      expect(isSameVersionOrHigher(local, remote)).toBe(true);
    });

    it('should return false when the local version is lower than the remote', () => {
      const local = { version: '0.0.1' };
      const remote = { versions: { '0.0.2': {} } };
      expect(isSameVersionOrHigher(local, remote)).toBe(false);
    });

    it('shouold ignore beta versions', () => {
      const local = { version: '3.7.0' };
      const remote = { versions: '3.7.0-beta.0' };
      expect(isSameVersionOrHigher(local, remote)).toBe(true);
    });
  });

  describe('#fetchRemotePackage', () => {
    it('when given a package name it should retive the package.json from the npm registry', async () => {
      const packageName = 'tiny-tarball'; // tiny-tarball used for health checks
      const packageJson = await fetchRemotePackage(packageName);
      expect(packageJson.name).toBe(packageName);
      expect(packageJson.versions['1.0.0']).toBeTruthy();
    });
  });


  describe('#checkVersion', () => {
    beforeEach(() => fetchMock.doMock());
    it('should call console.warn when local version is lower than remote', async () => {
      jest.mock('console');
      console.warn = jest.fn();
      console.info = jest.fn();

      const currentVersion = currentPackage.version;
      const nextVersion = semver.inc(currentVersion, 'minor');
      const resp = JSON.stringify({ versions: { [nextVersion]: {} } });

      fetchMock.mockResponse(resp);

      const result = await checkVersion();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  it('should call console.warn when local version is equal remote', async () => {
    jest.mock('console');
    console.warn = jest.fn();
    console.info = jest.fn();

    const currentVersion = currentPackage.version;
    const resp = JSON.stringify({ versions: { [currentVersion]: {} } });

    fetchMock.mockResponse(resp);

    const result = await checkVersion();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
