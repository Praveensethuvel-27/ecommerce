import { useState } from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const phone = '+919876543210';
const email = 'hello@grandmascare.com';
const whatsappUrl = 'https://wa.me/919876543210';

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! We will get back to you soon.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#6B4423] mb-8 text-center">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <h2 className="font-semibold text-[#6B4423] mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <a href={'tel:' + phone} className="flex items-center gap-3 text-[#6B4423] hover:text-[#2D5A27]">
                <Phone className="w-5 h-5 text-[#2D5A27]" />
                {phone}
              </a>
              <a href={'mailto:' + email} className="flex items-center gap-3 text-[#6B4423] hover:text-[#2D5A27]">
                <Mail className="w-5 h-5 text-[#2D5A27]" />
                {email}
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:opacity-90">
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold text-[#6B4423] mb-4">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-[#6B4423] mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] placeholder:text-[#8B7355]/60 focus:outline-none focus:ring-2 focus:ring-[#4A7C59]"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full">Send Message</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Contact;
