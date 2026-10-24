import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-center">
      <div className="text-7xl mb-6">🏠</div>
      <span className="text-3xl font-black text-brand-500 tracking-tight mb-6 block">homie</span>
      <h1 className="text-5xl font-black text-charcoal mb-3">404</h1>
      <p className="text-clay text-lg mb-8">This page doesn't exist.</p>
      <Link to="/" className="btn-primary px-8 py-3 text-base">
        Go home
      </Link>
    </div>
  );
}
