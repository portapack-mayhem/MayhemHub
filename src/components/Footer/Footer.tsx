import { faGithubAlt } from "@fortawesome/free-brands-svg-icons";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const handleRefresh = () => {
  window.location.reload();
};

export const Footer = () => {
  return (
    <footer className="footer mt-10 items-center bg-neutral p-4 text-neutral-content">
      <aside className="grid-flow-row items-center">
        <p>Mayhem Hub - {new Date().getFullYear()}</p>
        <small>Version: {process.env.BUILD_ID}</small>
      </aside>
      <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <a
          href="https://github.com/portapack-mayhem/MayhemHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon
            icon={faGithubAlt}
            className="mr-2 max-w-6 text-2xl text-white"
          />
        </a>
        <button onClick={handleRefresh}>
          <FontAwesomeIcon
            icon={faRotateRight}
            className="mr-2 max-w-6 text-2xl text-white"
          />
        </button>
      </nav>
    </footer>
  );
};
