import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SectionHead, { Frame } from './SectionHead'

/**
 * Quiz — four questions that check the story landed. Each answer reveals a
 * one-line explanation, so wrong answers still teach.
 */
const QUESTIONS = [
  {
    q: 'It is a calm, cloudy evening. What happens to the spot price?',
    options: ['It falls', 'It rises', 'It stays the same'],
    answer: 1,
    why: 'Wind and sun are quiet while demand peaks, so expensive gas and coal plants set the price.',
  },
  {
    q: 'What is base load?',
    options: ['The busiest hour of the day', 'The minimum power always needed', 'Power from batteries'],
    answer: 1,
    why: 'Base load is the steady floor of demand that exists even at 3 a.m.',
  },
  {
    q: 'Why would a grid operator switch off working wind turbines?',
    options: ['They are broken', 'There is more supply than demand', 'To save the wind for later'],
    answer: 1,
    why: 'This is curtailment: if supply beats demand and nothing can store the surplus, turbines are turned down.',
  },
  {
    q: 'Which is the best time to charge an electric car for low carbon?',
    options: ['During the evening peak', 'When wind and solar are strong', 'Whenever the car is plugged in'],
    answer: 1,
    why: 'When renewables are abundant, less fossil fuel is burned for each unit of electricity.',
  },
]

export default function Quiz() {
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const done = step >= QUESTIONS.length
  const q = QUESTIONS[step]

  const choose = (i) => {
    if (picked !== null) return
    setPicked(i)
    if (i === q.answer) setScore((s) => s + 1)
  }
  const next = () => {
    setPicked(null)
    setStep((s) => s + 1)
  }
  const restart = () => {
    setStep(0)
    setPicked(null)
    setScore(0)
  }

  return (
    <section id="quiz" className="border-t border-orange-900/50">
      <Frame>
        <SectionHead index="06" label="Check yourself" blurb="Four quick questions on what you just saw.">
          Did it <em>land?</em>
        </SectionHead>

        <div className="min-h-[420px] px-5 py-8 sm:px-8 sm:py-12" aria-live="polite">
          <div className="mx-auto max-w-3xl">
            <AnimatePresence mode="wait">
              {!done ? (
                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="eyebrow">Question {step + 1} of {QUESTIONS.length}</div>
                  <h3 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl">{q.q}</h3>
                  <div className="mt-7 space-y-2">
                    {q.options.map((o, i) => {
                      const right = picked !== null && i === q.answer
                      const wrong = picked === i && i !== q.answer
                      return (
                        <motion.button
                          key={o}
                          whileTap={picked === null ? { scale: 0.99 } : undefined}
                          onClick={() => choose(i)}
                          disabled={picked !== null}
                          className={`flex w-full items-center gap-4 border px-5 py-4 text-left text-base font-bold transition-colors ${
                            right
                              ? 'border-amber bg-amber text-void'
                              : wrong
                              ? 'border-sunset text-ink/50 line-through'
                              : picked === null
                              ? 'border-orange-900/60 hover:border-amber hover:bg-amber/10'
                              : 'border-orange-900/40 opacity-50'
                          }`}
                        >
                          <span className="text-sm opacity-60">{String.fromCharCode(65 + i)}</span>
                          {o}
                          {right && <span className="ml-auto text-xs font-extrabold uppercase tracking-wider">Correct</span>}
                        </motion.button>
                      )
                    })}
                  </div>
                  {picked !== null && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                      <p className="border-l-4 border-amber pl-4 leading-relaxed text-ink/85">{q.why}</p>
                      <button onClick={next} className="btn btn-primary mt-5">
                        {step === QUESTIONS.length - 1 ? 'See score' : 'Next →'}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="eyebrow">Your score</div>
                  <div className="numeral mt-2 text-[9rem]">
                    {score}<span className="text-5xl text-ink/40">/{QUESTIONS.length}</span>
                  </div>
                  <p className="mt-4 text-lg text-ink/80">
                    {score === QUESTIONS.length ? 'Perfect. You can read a grid.' : score >= 2 ? 'Solid. Try the simulator to lock it in.' : 'Scroll back to the story and try again.'}
                  </p>
                  <button onClick={restart} className="btn btn-primary mt-6">Play again</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Frame>
    </section>
  )
}
