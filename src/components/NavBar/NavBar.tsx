export const NavBar = () => {
  return (
    <div className="navbar bg-gray-700">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">Mayhem Hub</a>
      </div>
      <div className="hidden flex-none sm:block">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a href="https://discord.hackrf.app" target="_blank">
              Discord
            </a>
          </li>
          <li>
            <a href="https://repo.hackrf.app" target="_blank">
              Repo
            </a>
          </li>
          <li>
            <a href="https://wiki.hackrf.app" target="_blank">
              Wiki
            </a>
          </li>
          <li>
            <a href="https://release.hackrf.app" target="_blank">
              Firmware Releases
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
