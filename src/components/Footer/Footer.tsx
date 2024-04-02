import { faGithubAlt } from "@fortawesome/free-brands-svg-icons";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const Footer = () => {
  const refreshHandler = () => {
    window.location.reload();
  };

  return (
    <footer className="footer mt-10 items-center bg-neutral p-4 text-neutral-content">
      <aside className="grid-flow-row items-center">
        <p>Mayhem Hub - {new Date().getFullYear()}</p>
        <small>Version: {process.env.BUILD_ID}</small>
      </aside>
      <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <a href="https://github.com/portapack-mayhem/MayhemHub" target="_blank">
          <FontAwesomeIcon
            icon={faGithubAlt}
            className="mr-2 max-w-6 text-2xl text-white"
          />
        </a>
        <button onClick={refreshHandler}>
          <FontAwesomeIcon
            icon={faRotateRight}
            className="mr-2 max-w-6 text-2xl text-white"
          />
        </button>
      </nav>
    </footer>
  );
};
