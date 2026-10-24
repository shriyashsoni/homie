import { Link } from 'react-router-dom';
import {
  Wordmark,
  IconRoom, IconHandshake, IconKey, IconShield, IconSpark, IconChat,
  IconCalendar, IconSearch, IconPin, IconUsers, IconArrowRight, IconCheck, IconStar,
  IconInstagram, IconTwitter, IconLinkedin,
} from '../components/icons';
import { roomPhoto, heroRoom, PEOPLE } from '../assets/photos';

/* ───────── Compatibility ring ───────── */
function Ring({ value = 94, size = 56 }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#EFE7DB" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#AA0003" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Poppins, sans-serif" fontWeight="700" fontSize={size*0.26} fill="#2C1B14">{value}%</text>
    </svg>
  );
}

/* ───────── Hero collage ───────── */
function HeroCollage() {
  const p = PEOPLE.ananya;
  return (
    <div className="relative">
      {/* Main room photo */}
      <div className="rounded-3xl overflow-hidden shadow-elevated border border-charcoal/5 aspect-[4/5] max-w-sm ml-auto">
        <img src={heroRoom(900, 1100)} alt="A bright, furnished room in Bengaluru" className="w-full h-full object-cover" loading="eager" />
      </div>

      {/* Match card overlay */}
      <div className="absolute -left-4 bottom-10 w-60 bg-card rounded-2xl shadow-elevated border border-charcoal/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xs font-bold text-clay uppercase tracking-[0.14em]">Top match</span>
          <span className="flex items-center gap-1 text-2xs font-bold text-brand-500">
            <IconShield size={11} /> Verified
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img src={p.img} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-card flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-olive" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-charcoal text-sm leading-tight">{p.name}</p>
            <p className="text-2xs text-clay truncate">{p.role}</p>
          </div>
          <Ring value={94} size={44} />
        </div>
      </div>

      {/* Floating confirm pill */}
      <div className="absolute -right-3 top-8 bg-card rounded-2xl shadow-elevated border border-charcoal/5 px-3 py-2.5 flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-olive/15 text-olive flex items-center justify-center">
          <IconCalendar size={14} />
        </span>
        <div>
          <p className="text-2xs font-bold text-charcoal leading-none">Viewing confirmed</p>
          <p className="text-2xs text-clay mt-0.5">Sat · 3:00 PM</p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Intent card ───────── */
function IntentCard({ to, Icon, title, body, tint }) {
  return (
    <Link to={to} className="group bg-card rounded-3xl p-7 border border-charcoal/[0.07] hover:border-brand-500/40 hover:shadow-card-hover transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white" style={{ background: tint }}>
        <Icon size={22} stroke={1.8} />
      </div>
      <h3 className="font-display font-bold text-lg text-charcoal mb-2">{title}</h3>
      <p className="text-sm text-clay leading-relaxed mb-5">{body}</p>
      <span className="flex items-center gap-1.5 text-sm font-bold text-brand-500 group-hover:gap-2.5 transition-all">
        Get started <IconArrowRight size={15} />
      </span>
    </Link>
  );
}

/* ───────── Room card (real photo) ───────── */
function RoomCard({ photo, area, title, tags, price, score, host, furnished }) {
  const high = score >= 85;
  return (
    <div className="group bg-card rounded-3xl border border-charcoal/[0.07] shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img src={photo} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
        <span className="absolute top-3 left-3 bg-olive text-white text-2xs font-bold px-2.5 py-1 rounded-full shadow-sm">● Available</span>
        {furnished && <span className="absolute top-3 right-3 bg-black/45 backdrop-blur-sm text-white text-2xs font-semibold px-2.5 py-1 rounded-full">Furnished</span>}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/92 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
          <img src={host.img} alt={host.name} className="w-5 h-5 rounded-full object-cover" />
          <span className="text-charcoal text-2xs font-bold pr-0.5">{host.name.split(' ')[0]}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-2xs text-clay font-bold uppercase tracking-[0.1em] mb-1.5">{area}</p>
        <p className="font-display font-bold text-base text-charcoal truncate mb-3">{title}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(t => <span key={t} className="text-2xs font-semibold text-clay bg-sand px-2 py-1 rounded-lg">{t}</span>)}
        </div>
        <div className="flex items-center justify-between pt-3.5 rule-t">
          <p className="font-display"><span className="text-xl font-bold text-charcoal">₹{price}</span><span className="text-xs text-clay">/mo</span></p>
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${high ? 'bg-olive/12 text-olive' : 'bg-honey/15 text-[#A9781C]'}`}>
            <IconSpark size={11} /> {score}% fit
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Roommate match card (real portrait) ───────── */
function RoommateCard({ person, tags, budget, score }) {
  const high = score >= 85;
  return (
    <div className="group bg-card rounded-3xl border border-charcoal/[0.07] shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer">
      {/* Photo band */}
      <div className="relative pt-6 pb-4 px-5 flex flex-col items-center text-center bg-gradient-to-b from-brand-50/60 to-card">
        <span className={`absolute top-3 right-3 flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-lg ${high ? 'bg-olive text-white' : 'bg-honey text-[#5A3E06]'}`}>
          <IconSpark size={11} /> {score}%
        </span>
        <div className="relative mb-3">
          <img src={person.img} alt={person.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center shadow-sm">
            <span className="w-4 h-4 rounded-full bg-slate text-white flex items-center justify-center"><IconShield size={10} /></span>
          </span>
        </div>
        <p className="font-display font-bold text-charcoal">{person.name} <span className="text-clay font-normal">· {person.age}</span></p>
        <p className="text-xs text-clay flex items-center gap-1 mt-0.5"><IconPin size={11} /> {person.role} · {person.area}</p>
      </div>
      {/* Body */}
      <div className="px-5 pb-5">
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {tags.map(t => <span key={t} className="text-2xs font-semibold text-clay bg-sand px-2 py-1 rounded-lg">{t}</span>)}
        </div>
        <div className="flex items-center justify-between pt-3.5 rule-t">
          <div><p className="font-display font-bold text-charcoal text-sm">{budget}</p><p className="text-2xs text-clay">Budget / mo</p></div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-brand-500 group-hover:gap-2.5 transition-all"><IconChat size={14} /> Connect</span>
        </div>
      </div>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-2xs font-bold text-brand-500 uppercase tracking-[0.16em] mb-3">
      <span className="w-5 h-px bg-brand-500" />{children}
    </span>
  );
}

export default function Landing() {
  return (
    <div className="bg-cream overflow-x-hidden">

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 bg-cream/85 backdrop-blur-xl rule-b">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
          <Link to="/"><Wordmark className="text-2xl" /></Link>
          <nav className="hidden md:flex items-center gap-8">
            {[['#rooms', 'Rooms'], ['#roommates', 'Roommates'], ['#how', 'How it works']].map(([h, l]) => (
              <a key={h} href={h} className="text-sm font-semibold text-charcoal/65 hover:text-charcoal transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-bold text-charcoal/70 hover:text-charcoal px-4 py-2 rounded-full hover:bg-sand/70 transition-all">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started <IconArrowRight size={14} /></Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-card border border-charcoal/8 shadow-xs text-charcoal text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" /> Bengaluru's roommate-matching platform
            </span>
            <h1 className="font-display font-extrabold text-charcoal leading-[1.04] mb-5" style={{ fontSize: 'clamp(2.5rem, 5.2vw, 4.2rem)', textWrap: 'balance' }}>
              Find your person,<br />then your <span className="text-brand-500">place.</span>
            </h1>
            <p className="text-lg text-clay leading-relaxed max-w-md mb-8">
              Match with compatible flatmates and verified rooms across Bengaluru — scored on how you actually live, not just budget and location.
            </p>

            {/* Search */}
            <div className="bg-card rounded-2xl shadow-card border border-charcoal/8 p-2 flex flex-col sm:flex-row gap-1 max-w-xl">
              <div className="flex items-center gap-2 px-3 flex-1 min-w-0">
                <IconPin size={17} className="text-brand-500 flex-shrink-0" />
                <select className="w-full h-12 bg-transparent text-sm font-medium text-charcoal focus:outline-none cursor-pointer">
                  <option value="">Any area</option>
                  {['Koramangala','Indiranagar','HSR Layout','BTM Layout','Whitefield','Bellandur'].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="w-px bg-charcoal/8 hidden sm:block" />
              <div className="flex items-center gap-2 px-3 flex-1 min-w-0">
                <IconRoom size={17} className="text-brand-500 flex-shrink-0" />
                <select className="w-full h-12 bg-transparent text-sm font-medium text-charcoal focus:outline-none cursor-pointer">
                  <option value="">Any budget</option>
                  <option>Under ₹10k</option><option>₹10k–15k</option><option>₹15k–20k</option><option>₹20k–30k</option>
                </select>
              </div>
              <Link to="/register" className="btn-primary px-6 h-12 whitespace-nowrap"><IconSearch size={16} /> Search</Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-sm text-clay">
              {['Free to join', 'Zero brokerage', 'ID-verified members'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><IconCheck size={15} className="text-olive" /> {t}</span>
              ))}
            </div>
          </div>

          <div className="pr-6 lg:pr-10"><HeroCollage /></div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="panel-dark">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[['2,400+', 'Active members'], ['850+', 'Verified rooms'], ['94%', 'Match accuracy'], ['₹0', 'Brokerage, ever']].map(([n, l]) => (
            <div key={l} className="text-center md:text-left">
              <p className="font-display font-extrabold text-white text-3xl md:text-4xl">{n}</p>
              <p className="text-sm text-white/45 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INTENT ═══ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl mb-12"><Eyebrow>Three ways in</Eyebrow>
            <h2 className="font-display font-bold text-charcoal text-3xl md:text-4xl leading-tight">However you're looking, start here</h2></div>
          <div className="grid md:grid-cols-3 gap-5">
            <IntentCard to="/register?intent=FIND_ROOM" Icon={IconRoom} tint="#AA0003" title="I need a room" body="Browse verified Bengaluru listings and meet compatible flatmates before you commit." />
            <IntentCard to="/register?intent=FIND_PEOPLE" Icon={IconHandshake} tint="#6F9A5E" title="I need roommates" body="Find your people first, then a place together — matched on lifestyle and daily rhythm." />
            <IntentCard to="/register?intent=FILL_ROOM" Icon={IconKey} tint="#E8B23C" title="I have a room" body="List your space and reach only verified, genuinely compatible seekers. No brokers, no fees." />
          </div>
        </div>
      </section>

      {/* ═══ ROOMS ═══ */}
      <section id="rooms" className="py-20 md:py-24 bg-card rule-t rule-b">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between gap-4 mb-12">
            <div><Eyebrow>Fresh listings</Eyebrow>
              <h2 className="font-display font-bold text-charcoal text-3xl md:text-4xl leading-tight">Rooms available right now</h2></div>
            <Link to="/register" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-500 hover:gap-2.5 transition-all">Browse all <IconArrowRight size={15} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <RoomCard photo={roomPhoto(0)} area="Koramangala · 6th Block" title="Spacious private room" tags={['Private','AC','Wi-Fi']} price="18,000" score={92} host={PEOPLE.priya} furnished />
            <RoomCard photo={roomPhoto(1)} area="Indiranagar · 12th Main" title="Master bedroom, 2BHK" tags={['Private','Balcony','Attached']} price="22,500" score={78} host={PEOPLE.rahul} />
            <RoomCard photo={roomPhoto(2)} area="HSR Layout · Sector 2" title="Quiet room, clean 3BHK" tags={['Private','WFH','No smoking']} price="15,000" score={88} host={PEOPLE.deepika} furnished />
            <RoomCard photo={roomPhoto(4)} area="BTM Layout · Stage 2" title="Bright room near metro" tags={['Shared','Wi-Fi','Parking']} price="9,500" score={85} host={PEOPLE.karthik} />
          </div>
        </div>
      </section>

      {/* ═══ ROOMMATES ═══ */}
      <section id="roommates" className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-end justify-between gap-4 mb-12">
            <div><Eyebrow>Real people, really matched</Eyebrow>
              <h2 className="font-display font-bold text-charcoal text-3xl md:text-4xl leading-tight">Roommates who actually fit</h2></div>
            <Link to="/register" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-500 hover:gap-2.5 transition-all">See all <IconArrowRight size={15} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <RoommateCard person={PEOPLE.ananya}  tags={['Vegetarian','Non-smoker','Early riser']} budget="₹15–20k" score={94} />
            <RoommateCard person={PEOPLE.rahul}   tags={['Non-veg OK','Night owl','Tidy']}          budget="₹18–25k" score={87} />
            <RoommateCard person={PEOPLE.deepika} tags={['Jain diet','Quiet home','No alcohol']}    budget="₹12–18k" score={73} />
            <RoommateCard person={PEOPLE.vikram}  tags={['Gym lover','Veg pref.','Social']}         budget="₹20–28k" score={91} />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-20 md:py-24 bg-card rule-t rule-b">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl mb-14"><Eyebrow>The process</Eyebrow>
            <h2 className="font-display font-bold text-charcoal text-3xl md:text-4xl leading-tight">From signup to settled in four steps</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {[
              { Icon: IconSpark, t: 'Tell us your intent', b: 'Room, roommates, or filling a room. Set area, budget and move-in in under a minute.' },
              { Icon: IconHandshake, t: 'Take the lifestyle quiz', b: 'Eight questions on diet, cleanliness, sleep and vibe. Mark each a dealbreaker or flexible.' },
              { Icon: IconUsers, t: 'Get matched', b: 'We score every candidate on real compatibility and surface your best people and places first.' },
              { Icon: IconCalendar, t: 'Connect & move in', b: 'Message directly, book a viewing in-app, and sign your lease — with zero middlemen.' },
            ].map(({ Icon, t, b }, i) => (
              <div key={t}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-cream border border-charcoal/8 flex items-center justify-center text-brand-500"><Icon size={20} stroke={1.7} /></div>
                  <span className="font-display font-extrabold text-2xl text-sand">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-charcoal mb-2">{t}</h3>
                <p className="text-sm text-clay leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-xl mb-12"><Eyebrow>Stories from Bengaluru</Eyebrow>
            <h2 className="font-display font-bold text-charcoal text-3xl md:text-4xl leading-tight">People who found their homie</h2></div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { q: "Weeks of dead WhatsApp groups, then homie matched me in three days. Eight months in and we still get along great.", p: PEOPLE.priya, s: 5 },
              { q: "The quiz is the whole thing. My flatmate and I have opposite schedules but matched 91% on how we live. It works.", p: PEOPLE.rahul, s: 5 },
              { q: "After three bad flatmate experiences, an 87% score that actually meant something. We clicked on the first viewing.", p: PEOPLE.deepika, s: 4 },
            ].map(({ q, p, s }) => (
              <figure key={p.name} className="bg-card rounded-3xl border border-charcoal/[0.07] shadow-card p-7 flex flex-col">
                <div className="flex gap-0.5 mb-4 text-honey">
                  {Array(5).fill(0).map((_, i) => <IconStar key={i} size={15} filled={i < s} className={i < s ? '' : 'text-sand'} />)}
                </div>
                <blockquote className="text-charcoal leading-relaxed flex-1">"{q}"</blockquote>
                <figcaption className="flex items-center gap-3 mt-6 pt-5 rule-t">
                  <img src={p.img} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div><p className="font-bold text-charcoal text-sm">{p.name}</p><p className="text-xs text-clay">{p.role} · {p.area}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="pb-20 md:pb-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="panel-dark relative overflow-hidden rounded-[2rem] px-8 py-16 md:px-16 md:py-20">
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <Wordmark className="text-3xl mb-5 !text-white" />
                <h2 className="font-display font-extrabold text-white text-3xl md:text-5xl leading-[1.05] mb-4" style={{ textWrap: 'balance' }}>Your homie is already here</h2>
                <p className="text-white/55 text-lg mb-8">Join 2,400+ people finding their person and their place across Bengaluru — free to start.</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register" className="bg-white text-charcoal font-bold text-sm px-7 py-4 rounded-full hover:bg-cream transition-all hover:scale-[1.02] active:scale-95 inline-flex items-center gap-2">Create free account <IconArrowRight size={16} /></Link>
                  <Link to="/login" className="border border-white/25 text-white font-bold text-sm px-7 py-4 rounded-full hover:bg-white/5 transition-all">Sign in</Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] shadow-elevated">
                  <img src={roomPhoto(7, 800, 600)} alt="A warm shared living space" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="panel-dark">
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-10">
          <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 lg:gap-8 pb-12 border-b border-white/10">
            <div className="max-w-xs">
              <Wordmark className="text-xl mb-4 !text-white" />
              <p className="text-sm text-white/45 leading-relaxed mb-5">Find your person, then your place. Compatibility-first shared living, built for Bengaluru.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input type="email" placeholder="Your email" className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 h-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-500 transition-colors" />
                <button className="btn-primary !px-4 h-11 flex-shrink-0"><IconArrowRight size={16} /></button>
              </form>
            </div>
            {[
              { h: 'For seekers', l: [['Find a room', '/register?intent=FIND_ROOM'], ['Find roommates', '/register?intent=FIND_PEOPLE'], ['How matching works', '#how'], ['Safety & trust', '#']] },
              { h: 'For hosts', l: [['List a room', '/register?intent=FILL_ROOM'], ['Verify your listing', '#'], ['Host guide', '#'], ['Pricing', '#']] },
              { h: 'Company', l: [['About us', '#'], ['Blog', '#'], ['Careers', '#'], ['Contact', '#']] },
            ].map(({ h, l }) => (
              <div key={h}>
                <h4 className="text-2xs font-bold text-white/40 uppercase tracking-[0.12em] mb-4">{h}</h4>
                <ul className="space-y-3">{l.map(([label, to]) => <li key={label}><Link to={to} className="text-sm text-white/65 hover:text-white transition-colors">{label}</Link></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <p className="text-2xs text-white/35">© 2024 Find My Homie Pvt. Ltd. · Bengaluru, Karnataka, India</p>
            <div className="flex items-center gap-5">
              <div className="flex gap-4 text-2xs text-white/35">
                {['Privacy', 'Terms', 'Cookies'].map(l => <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>)}
              </div>
              <div className="flex items-center gap-2">
                {[IconInstagram, IconTwitter, IconLinkedin].map((Ico, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"><Ico size={16} /></a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
