import { GLOSSARY } from '../lib/glossary'
import Reveal from './Reveal'
import SectionHead, { Frame } from './SectionHead'

/** Glossary — every tooltip definition in one ruled grid. */
export default function Glossary() {
  return (
    <section id="glossary" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead index="07" label="Glossary" blurb="Each underlined term on the page is defined here in plain language.">
          Key <em>terms.</em>
        </SectionHead>
        <div className="grid gap-px bg-orange-900/50 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(GLOSSARY).map(([k, g], i) => (
            <Reveal key={k} delay={(i % 3) * 0.06} className="bg-void">
              <div className="h-full px-5 py-8 sm:px-8">
                <div className="eyebrow">{String(i + 1).padStart(2, '0')} · {g.label}</div>
                <div className="mt-3 text-2xl font-black uppercase leading-[0.95] tracking-tight">{g.short}</div>
                <p className="mt-3 text-sm leading-relaxed text-mute">{g.long}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Frame>
    </section>
  )
}
