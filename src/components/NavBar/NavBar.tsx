import "./NavBar.css";

const NAV_LINKS = [
  { href: "https://discord.hackrf.app", label: "Discord" },
  { href: "https://wiki.hackrf.app", label: "Wiki" },
  { href: "https://release.hackrf.app", label: "Firmware Releases" },
  { href: "https://github.com/portapack-mayhem/MayhemHub", label: "Hub Repo" },
  { href: "https://repo.hackrf.app", label: "FW Repo" },
];

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
          <span />
          <span />
          <span />
        </label>
      </div>

      <div className="nav-links float-end flex bg-neutral text-lg text-neutral-content">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
};
