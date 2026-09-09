export default function SiteNav({ current }) {
  const linkClass = (key) => (current === key ? 'current' : undefined);

  return (
    <nav className="topnav" aria-label="Site">
      <div className="brand-block">
        <img
          src="/RISE_UG_LOGO_Transparent.png"
          alt="Rise Underground"
          className="brand-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = document.getElementById('brandFallback');
            if (fb) fb.style.display = 'block';
          }}
        />
        <div className="brand-fallback" id="brandFallback" style={{ display: 'none' }}>Rise Underground</div>
        <div className="tagline">Operating in the shadows</div>
      </div>
      <div className="nav-links">
        <a href="/" className={linkClass('home')}>Home</a>
        <a href="/poa-tracker/" className={linkClass('poa')}>POA Tracker</a>
        <a href="/ir-almanac/" className={linkClass('almanac')}>IR Almanac</a>
        <a href="/leaderboard/" className={linkClass('leaderboard')}>Leaderboards</a>
        <a href="/rise-tracker/" className={linkClass('rise')}>Rise Tracker</a>
      </div>
    </nav>
  );
}
