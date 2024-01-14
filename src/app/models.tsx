export interface LatestVersions {
  stable: VersionDetails;
  nightly: VersionDetails;
}

export interface VersionDetails {
  version: string;
  published_at: string;
}
