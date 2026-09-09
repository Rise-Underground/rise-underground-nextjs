export default function PageHero({ eyebrow, title, subtitle }) {
  return (
    <header>
      <div className="eyebrow">{eyebrow}</div>
      <h1><span>{title}</span></h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  );
}
