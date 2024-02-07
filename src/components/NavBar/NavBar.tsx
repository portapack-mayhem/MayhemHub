import "./NavBar.css";

export const NavBar = () => {
  return (
    <div className="nav bg-neutral">
      <input type="checkbox" id="nav-check" />
      <div className="nav-header">
        <div className="nav-title p-3 text-3xl text-neutral-content">
          Mayhem Hub
        </div>
      </div>
      <div className="nav-btn">
        <label htmlFor="nav-check">
          <span></span>
          <span></span>
          <span></span>
        </label>
      </div>

      <div className="nav-links float-end flex bg-neutral text-lg text-neutral-content">
        <a href="https://discord.hackrf.app" target="_blank" className="p-4">
          Discord
        </a>
        <a href="https://repo.hackrf.app" target="_blank" className="p-4">
          Repo
        </a>
        <a href="https://wiki.hackrf.app" target="_blank" className="p-4">
          Wiki
        </a>
        <a href="https://release.hackrf.app" target="_blank" className="p-4">
          Firmware Releases
        </a>
      </div>
    </div>
  );
};
