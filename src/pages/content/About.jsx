import { Leaf, Heart, Shield } from 'lucide-react';
import Card from '../../components/common/Card';

const values = [
  { icon: Leaf, title: 'Natural Ingredients', desc: '100% organic, no chemicals, pure traditional goodness.' },
  { icon: Heart, title: 'Handcrafted with Love', desc: 'Family recipes passed down through generations.' },
  { icon: Shield, title: 'Tamil Heritage', desc: 'Preserving and celebrating traditional Tamil organic practices.' },
];

function About() {
  return (
    <div>
      <section className="bg-[#2D5A27] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">
            Our Story
          </h1>
          <p className="text-xl text-white/90">
            Grand Ma's Care was born from a simple belief: traditional Tamil organic products
            deserve to reach every home. Our family recipes, handcrafted with love and passed
            down through generations, bring you the purest forms of Nalangu Maavu, Kasturi
            Manjal, and many more.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-[#6B4423] mb-8 text-center">Our Mission</h2>
        <p className="text-center text-[#8B7355] max-w-2xl mx-auto mb-12">
          To make authentic Tamil organic products accessible to everyone, while preserving
          traditional recipes and supporting sustainable farming practices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[#2D5A27]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[#6B4423] mb-2">{v.title}</h3>
                <p className="text-sm text-[#8B7355]">{v.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default About;
