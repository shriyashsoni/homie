import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { profileApi } from '../../api';

const QUESTIONS = [
  {
    id: 'Q1', dimension: 'Cleanliness',
    text: 'How do you like shared spaces to be kept?',
    options: [
      { code: 'A', label: 'Reset after each use' },
      { code: 'B', label: 'Clean daily, temporary mess is okay' },
      { code: 'C', label: 'Weekly reset' },
      { code: 'D', label: 'Relaxed as long as it\'s hygienic' },
    ],
  },
  {
    id: 'Q3', dimension: 'Quiet hours',
    text: 'What quiet time feels right on weeknights?',
    options: [
      { code: 'A', label: 'Around 9:30 pm' },
      { code: 'B', label: 'Around 10:30 pm' },
      { code: 'C', label: 'Around midnight' },
      { code: 'D', label: 'No fixed quiet time' },
    ],
  },
  {
    id: 'Q5', dimension: 'WFH',
    text: 'How often do you work or study from home?',
    options: [
      { code: 'A', label: 'Almost every day' },
      { code: 'B', label: 'A few days a week' },
      { code: 'C', label: 'Occasionally' },
      { code: 'D', label: 'Rarely/never' },
    ],
  },
  {
    id: 'Q6', dimension: 'Guests',
    text: 'How often do you like having friends over?',
    options: [
      { code: 'A', label: 'Rarely' },
      { code: 'B', label: 'Sometimes, with notice' },
      { code: 'C', label: 'A few times a week' },
      { code: 'D', label: 'I like a social house' },
    ],
  },
  {
    id: 'Q8', dimension: 'Home vibe',
    text: 'What should home feel like?',
    options: [
      { code: 'A', label: 'Quiet and independent' },
      { code: 'B', label: 'Friendly, occasional shared time' },
      { code: 'C', label: 'Regular meals/activities' },
      { code: 'D', label: 'Lively and social' },
    ],
  },
  {
    id: 'F1', dimension: 'Diet',
    text: 'Which best describes your food preferences?',
    options: [
      { code: 'VEG', label: '🥦 Vegetarian' },
      { code: 'VEG_EGG', label: '🥚 Vegetarian + eggs okay' },
      { code: 'NON_VEG', label: '🍗 Non-vegetarian' },
      { code: 'VEGAN', label: '🌱 Vegan' },
      { code: 'JAIN', label: '✨ Jain dietary practice' },
      { code: 'PREFER_NOT', label: '🤐 Prefer not to say' },
    ],
  },
  {
    id: 'F2', dimension: 'Cooking boundary',
    text: 'What food can be prepared in your home?',
    options: [
      { code: 'ANY', label: 'Anything' },
      { code: 'NO_MEAT', label: 'No meat cooked at home' },
      { code: 'NO_NON_VEG', label: 'No non-vegetarian food in the home' },
      { code: 'DISCUSS', label: 'Open to discussing arrangements' },
    ],
  },
  {
    id: 'F6', dimension: 'Alcohol',
    text: 'What is your preference around alcohol in the home?',
    options: [
      { code: 'NO_ALCOHOL', label: 'No alcohol in home' },
      { code: 'OUTSIDE_ONLY', label: 'Okay outside, not at home' },
      { code: 'OCCASIONAL', label: 'Occasional use okay' },
      { code: 'NO_PREF', label: 'No preference' },
    ],
  },
];

export default function OnboardingQuiz() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [strength, setStrength] = useState('FLEXIBLE');

  const q = QUESTIONS[current];
  const progress = Math.round(((current) / QUESTIONS.length) * 100);

  const handleAnswer = (code) => {
    setAnswers((a) => ({ ...a, [q.id]: code }));
  };

  const handleNext = async () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      await finish();
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      for (const [questionId, answerCode] of Object.entries(answers)) {
        const qInfo = QUESTIONS.find((q) => q.id === questionId);
        await profileApi.saveQuizAnswer({
          questionId,
          questionText: qInfo?.text || '',
          answerCode,
          strength,
        }).catch(() => {});
      }
    } finally {
      navigate('/onboarding/review');
    }
  };

  const isAnswered = !!answers[q.id];

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center p-4 pt-8">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-clay">Question {current + 1} of {QUESTIONS.length}</p>
          <p className="text-xs text-clay">{progress}% complete</p>
        </div>
        <div className="h-1.5 bg-sand rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-2">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-widest">{q.dimension}</span>
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-6">{q.text}</h2>

        <div className="space-y-2 mb-6">
          {q.options.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => handleAnswer(code)}
              className={`w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                answers[q.id] === code
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-charcoal/12 bg-white text-charcoal hover:border-charcoal/20'
              }`}
            >
              <div className="flex items-center gap-3">
                {answers[q.id] === code && <CheckCircle size={16} className="text-brand-500 flex-shrink-0" />}
                {answers[q.id] !== code && <div className="w-4 h-4 rounded-full border-2 border-charcoal/20 flex-shrink-0" />}
                {label}
              </div>
            </button>
          ))}
        </div>

        {/* Preference strength */}
        <div className="mb-6">
          <label className="block text-xs text-clay mb-2">How important is this to you?</label>
          <div className="flex gap-2">
            {[
              { value: 'MUST_HAVE', label: 'Must-have' },
              { value: 'STRONG_PREFERENCE', label: 'Strong preference' },
              { value: 'FLEXIBLE', label: 'Flexible' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStrength(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  strength === value
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-clay border-charcoal/12 hover:border-charcoal/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => current > 0 ? setCurrent((c) => c - 1) : navigate('/onboarding/essentials')}
            className="btn-ghost flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className={`flex-1 btn-primary flex items-center justify-center gap-2 ${!isAnswered ? 'opacity-70' : ''}`}
          >
            {saving ? 'Saving…' : current === QUESTIONS.length - 1 ? 'Finish quiz' : 'Next'}
            {!saving && <ArrowRight size={16} />}
          </button>
        </div>

        <button
          onClick={() => current < QUESTIONS.length - 1 ? setCurrent((c) => c + 1) : finish()}
          className="w-full text-center text-xs text-clay hover:text-charcoal/80 mt-3 py-2"
        >
          Skip this question
        </button>
      </div>
    </div>
  );
}
