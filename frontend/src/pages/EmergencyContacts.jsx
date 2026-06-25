import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { emergencyContactAPI } from '../services/api';
import Loader from '../components/Loader';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: '', priority: 0 });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    emergencyContactAPI.list()
      .then((res) => setContacts(res.data.data.contacts))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await emergencyContactAPI.update(editing, form);
        toast.success('Contact updated');
      } else {
        await emergencyContactAPI.create(form);
        toast.success('Contact added');
      }
      const res = await emergencyContactAPI.list();
      setContacts(res.data.data.contacts);
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', phone: '', email: '', relationship: '', priority: 0 });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleEdit = (contact) => {
    setForm({ name: contact.name, phone: contact.phone, email: contact.email || '', relationship: contact.relationship || '', priority: contact.priority || 0 });
    setEditing(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this emergency contact?')) return;
    try {
      await emergencyContactAPI.remove(id);
      const res = await emergencyContactAPI.list();
      setContacts(res.data.data.contacts);
      toast.success('Contact removed');
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">These contacts will be notified if you trigger an SOS</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', phone: '', email: '', relationship: '', priority: 0 }); }} className="btn-primary">
          + Add Contact
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} Emergency Contact</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="input-field" placeholder="Spouse, Parent, Friend" />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Contact</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
          </svg>
          <p className="text-gray-500">No emergency contacts added</p>
          <p className="text-gray-400 text-sm mt-1">Add at least one contact for SOS alerts to work</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-700">{contact.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    <p className="text-sm text-gray-500">{contact.phone} {contact.email && `· ${contact.email}`}</p>
                    <p className="text-xs text-gray-400">{contact.relationship || 'Not specified'} {contact.priority > 0 && `· Priority ${contact.priority}`}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleEdit(contact)} className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                  <button onClick={() => handleDelete(contact.id)} className="text-sm text-danger-600 hover:text-danger-700">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-warning-50 border-warning-200">
        <h3 className="font-semibold text-warning-600 mb-2">Important</h3>
        <p className="text-sm text-warning-700">
          Emergency contacts are notified via email when you trigger an SOS. Make sure your contacts' email addresses are correct. Add multiple contacts with different priorities to ensure someone reaches you quickly.
        </p>
      </div>
    </div>
  );
}
