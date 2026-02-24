import { Accordion } from '../../components/common/Accordion';

const faqItems = [
  {
    title: 'How do I place an order?',
    content: 'Browse our products, add items to cart, and proceed to checkout. Fill in your delivery details and choose a payment method to complete your order.',
  },
  {
    title: 'What are the shipping options?',
    content: 'We offer standard shipping. Free shipping on orders above Rs. 999. Orders are typically delivered within 5-7 business days across India.',
  },
  {
    title: 'Are all products organic?',
    content: 'Yes! Grand Ma\'s Care products are made from 100% organic ingredients, following traditional Tamil recipes with no chemicals or additives.',
  },
  {
    title: 'How can I track my order?',
    content: 'You can track your order by visiting the Track Order page and entering your Order ID. You will also receive updates via email and SMS.',
  },
  {
    title: 'What is your return policy?',
    content: 'We accept returns within 7 days of delivery for unopened products. Contact us at hello@grandmascare.com to initiate a return.',
  },
];

function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#6B4423] mb-8 text-center">Frequently Asked Questions</h1>
      <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
        <Accordion items={faqItems} />
      </div>
    </div>
  );
}

export default FAQ;
