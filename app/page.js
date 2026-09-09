'use client';

export default function Home() {
  const handleLogoEnded = (e) => {
    const logo = e.currentTarget;
    logo.currentTime = logo.duration;
    logo.pause();
  };

  return (
    <>
      <div className="stage">
        <div className="logo-wrap">
          <video id="logo" autoPlay muted playsInline onEnded={handleLogoEnded}>
            <source src="/assets/riseug_logo.mp4" type="video/mp4" />
          </video>
        </div>

        <nav className="menu" aria-label="Main menu">
          <div className="menu-divider">Access</div>
          <a className="menu-item" href="/poa-tracker/">
            <span className="menu-item-label">POA Tracker</span>
            <span className="menu-arrow">&rarr;</span>
          </a>
          <a className="menu-item" href="/rise-tracker/">
            <span className="menu-item-label">RISE Tracker</span>
            <span className="menu-arrow">&rarr;</span>
          </a>
          <a className="menu-item" href="/leaderboard/">
            <span className="menu-item-label">Leader of the Leader Boards</span>
            <span className="menu-arrow">&rarr;</span>
          </a>
          <a className="menu-item" href="/ir-almanac/">
            <span className="menu-item-label">Infinity Rising Almanac</span>
            <span className="menu-arrow">&rarr;</span>
          </a>
          <a
            className="menu-item"
            href="https://infinity-rising-hub.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="menu-item-label">Infinity Rising Hub</span>
            <span className="menu-arrow">&rarr;</span>
          </a>
        </nav>
      </div>

      <footer>
        <a
          className="social-link"
          href="https://x.com/RiseUGX"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="RISE Underground on X"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </footer>
    </>
  );
}
