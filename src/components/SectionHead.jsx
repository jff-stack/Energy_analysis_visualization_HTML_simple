import Reveal from './Reveal'

/**
 * SectionHead — the shared editorial header: a ruled three-column band with
 * the section index, a slammed headline, and a short plain-English blurb.
 * Every major section opens with it so the page reads as one system.
 */
export default function SectionHead({ index, label, blurb, children }) {
  return (
    <Reveal>
      <div className="grid border-b border-orange-900/50 lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex items-start border-b border-orange-900/50 px-5 py-5 sm:px-8 lg:border-b-0 lg:border-r">
          <span className="eyebrow">{index} / {label}</span>
        </div>
        <h2 className="display px-5 py-10 text-[clamp(2.8rem,8vw,7.5rem)] sm:px-8 sm:py-14">{children}</h2>
        {blurb && (
          <p className="border-t border-orange-900/50 px-5 py-6 text-[17px] leading-relaxed text-ink/70 sm:px-8 lg:border-l lg:border-t-0 lg:py-14">
            {blurb}
          </p>
        )}
      </div>
    </Reveal>
  )
}

/** Frame — the ruled, centred column every section's content sits in. */
export function Frame({ children, className = '' }) {
  return <div className={`mx-auto max-w-[1500px] lg:border-x lg:border-orange-900/50 ${className}`}>{children}</div>
}
