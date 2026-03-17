import Link from 'next/link';
import './SectionBanner.css';

export default function SectionBanner({ title, backgroundImage, buttonText, buttonLink }) {
  return (
    <div className="section-banner">
      <div className="section-banner-bg" style={{ backgroundImage: `url(${backgroundImage})` }}></div>
      <div className="section-banner-overlay"></div>
      <div className="container section-banner-content">
        <h2>{title}</h2>
        {buttonText && buttonLink && (
          <Link href={buttonLink} className="btn btn-primary">
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}
