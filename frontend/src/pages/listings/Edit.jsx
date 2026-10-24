import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '../../api';
import Button from '../../components/ui/Button';
import { useState, useEffect } from 'react';
import Input from '../../components/ui/Input';

export default function ListingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const { data } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingApi.getById(id),
  });

  useEffect(() => {
    if (data?.data?.data?.listing) {
      const l = data.data.data.listing;
      setForm({
        title: l.title || '',
        description: l.description || '',
        rent: l.rent?.toString() || '',
        maintenance: l.maintenance?.toString() || '',
        deposit: l.deposit?.toString() || '',
        brokerage: l.brokerage?.toString() || '',
        area: l.area || '',
        householdVibe: l.householdVibe || '',
        cookingRules: l.cookingRules || '',
      });
    }
  }, [data]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await listingApi.update(id, {
        ...form,
        rent: parseInt(form.rent),
        maintenance: form.maintenance ? parseInt(form.maintenance) : undefined,
        deposit: form.deposit ? parseInt(form.deposit) : undefined,
        brokerage: form.brokerage ? parseInt(form.brokerage) : undefined,
      });
      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="card p-8 animate-pulse max-w-2xl mx-auto" />;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="page-title">Edit Listing</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      <div className="card p-6 space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <Input label="Area" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Rent (₹)" type="number" value={form.rent} onChange={(e) => setForm((f) => ({ ...f, rent: e.target.value }))} />
          <Input label="Maintenance (₹)" type="number" value={form.maintenance} onChange={(e) => setForm((f) => ({ ...f, maintenance: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Deposit (₹)" type="number" value={form.deposit} onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))} />
          <Input label="Brokerage (₹)" type="number" value={form.brokerage} onChange={(e) => setForm((f) => ({ ...f, brokerage: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">Description</label>
          <textarea
            className="input-field h-24 resize-none"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1.5">Cooking rules</label>
          <textarea
            className="input-field h-20 resize-none"
            value={form.cookingRules}
            onChange={(e) => setForm((f) => ({ ...f, cookingRules: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        <Button loading={loading} onClick={handleSave} className="flex-1">Save changes</Button>
      </div>
    </div>
  );
}
