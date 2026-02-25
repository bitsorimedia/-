import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Menu, 
  X, 
  ChevronRight, 
  Instagram, 
  Youtube, 
  Mail,
  Lock,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

// --- Types ---
interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  thumbnail: string;
  video_url?: string;
  problem?: string;
  solution?: string;
  result?: string;
}

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  budget: string;
  message: string;
  created_at: string;
}

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '포트폴리오', href: '#work' },
    { name: '소개', href: '#about' },
    { name: '제작과정', href: '#process' },
    { name: '문의하기', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-dark/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter">빛소리미디어</Link>
        
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a key={link.name} href={link.href} className="text-sm font-medium hover:text-white/60 transition-colors uppercase tracking-widest">
              {link.name}
            </a>
          ))}
          <a href="#contact" className="px-5 py-2 bg-white text-dark text-xs font-bold uppercase tracking-widest rounded-full hover:bg-white/90 transition-all">
            프로젝트 문의
          </a>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 bg-dark z-[60] flex flex-col p-8"
          >
            <div className="flex justify-end">
              <button onClick={() => setMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="flex flex-col gap-8 mt-12">
              {navLinks.map(link => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-4xl font-serif italic hover:text-white/50 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Video Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-dark/60 z-10" />
        <img 
          src="https://picsum.photos/seed/showreel/1920/1080?blur=2" 
          className="w-full h-full object-cover"
          alt="Showreel Background"
        />
        {/* In a real app, this would be a <video> tag */}
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-white/60 mb-6"
        >
          Professional Video Editor & Designer
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
        >
          시선을 머물게 하고,<br />
          <span className="text-gradient">마음을 움직이는</span> 영상을 만듭니다.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <a href="#contact" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-dark rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform">
            프로젝트 문의하기 <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-px h-12 bg-white" />
      </div>
    </section>
  );
};

const WorkSection = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [filter, setFilter] = useState('All');
  const categories = ['All', '유튜브 콘텐츠', '브랜드 홍보 영상', '숏폼'];

  useEffect(() => {
    fetch('/api/portfolio').then(res => res.json()).then(setItems);
  }, []);

  const filteredItems = filter === 'All' ? items : items.filter(item => item.category === filter);

  return (
    <section id="work" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Selected Works</h2>
          <h3 className="text-4xl md:text-6xl font-bold tracking-tight">포트폴리오</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${filter === cat ? 'bg-white text-dark border-white' : 'border-white/20 hover:border-white/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {filteredItems.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group cursor-pointer"
          >
            <Link to={`/work/${item.id}`}>
              <div className="relative aspect-video overflow-hidden rounded-2xl mb-6">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Play fill="white" size={24} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{item.category}</p>
                  <h4 className="text-2xl font-serif">{item.title}</h4>
                </div>
                <ChevronRight className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const AboutSection = () => {
  const strengths = [
    {
      title: "트렌디한 시각적 연출",
      desc: "타이포그래피와 모션그래픽을 활용하여 감각적이고 세련된 영상을 제작합니다."
    },
    {
      title: "채널 운영자의 시선",
      desc: "단순 편집을 넘어 유튜브 채널 기획 및 운영 노하우를 바탕으로 시청자 타겟팅 전략을 제안합니다."
    },
    {
      title: "철저한 마감과 소통",
      desc: "클라이언트와의 긴밀한 소통을 통해 의도를 정확히 파악하고 약속된 일정을 반드시 준수합니다."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white/5">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden">
            <img 
              src="https://picsum.photos/seed/profile/800/1000" 
              alt="Profile"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white rounded-3xl p-8 hidden md:flex flex-col justify-end">
            <p className="text-dark text-4xl font-serif font-bold">08+</p>
            <p className="text-dark/60 text-xs font-bold uppercase tracking-widest">Years Exp.</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">About Me</h2>
          <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">함께 일하고 싶은 파트너</h3>
          <p className="text-lg text-white/60 mb-12 leading-relaxed">
            영상은 단순한 기록이 아닌, 브랜드의 가치를 전달하는 가장 강력한 언어입니다. 
            기획부터 편집까지, 당신의 비전을 가장 빛나는 순간으로 담아내겠습니다.
          </p>

          <div className="space-y-8">
            {strengths.map((s, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">0{idx + 1}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{s.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ProcessSection = () => {
  const steps = [
    { title: "문의 및 상담", desc: "프로젝트의 목적과 레퍼런스를 공유합니다." },
    { title: "기획 및 견적", desc: "상세 기획안과 합리적인 견적을 제안합니다." },
    { title: "촬영/편집", desc: "본격적인 제작 과정에 착수합니다." },
    { title: "수정 및 피드백", desc: "1, 2차 수정을 통해 완성도를 높입니다." },
    { title: "최종 납품", desc: "최적화된 포맷으로 최종 결과물을 전달합니다." }
  ];

  return (
    <section id="process" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Work Flow</h2>
        <h3 className="text-4xl md:text-6xl font-bold tracking-tight">제작 프로세스</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            <div className="mb-6 text-6xl font-serif italic text-white/5 group-hover:text-white/20 transition-colors">
              {idx + 1}
            </div>
            <h4 className="text-lg font-bold mb-3">{step.title}</h4>
            <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-12 -right-4 w-8 h-px bg-white/10" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const Testimonials = () => {
  const reviews = [
    { name: "채널 '살림백서'", text: "요청사항을 찰떡같이 이해하고 반영해 주셨어요. 덕분에 조회수가 이전보다 2배 이상 늘었습니다." },
    { name: "브랜드 '모던하우스'", text: "채널 분위기에 맞는 톤앤매너를 정확히 잡아주셨습니다. 마감 기한도 항상 칼같이 지켜주셔서 든든합니다." },
    { name: "유튜버 '테크마스터'", text: "복잡한 내용을 인포그래픽으로 깔끔하게 정리해주셔서 시청자 반응이 너무 좋습니다." }
  ];

  return (
    <section className="py-24 bg-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-20">
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Social Proof</h2>
            <h3 className="text-4xl md:text-6xl font-bold tracking-tight">신뢰의 결과들</h3>
          </div>
          <div className="flex flex-wrap gap-12 opacity-30 grayscale items-center">
            {/* Mock Partner Logos */}
            <div className="text-2xl font-bold">SAMSUNG</div>
            <div className="text-2xl font-bold">NIKE</div>
            <div className="text-2xl font-bold">ADIDAS</div>
            <div className="text-2xl font-bold">SONY</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, idx) => (
            <div key={idx} className="p-8 glass rounded-3xl">
              <MessageSquare className="text-white/20 mb-6" size={32} />
              <p className="text-lg italic mb-8 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <span className="font-bold text-sm">{r.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    setStatus('success');
    setTimeout(() => setStatus('idle'), 3000);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contact" className="py-24 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Contact</h2>
          <h3 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">새로운 프로젝트를<br />시작할 준비가 되셨나요?</h3>
          <p className="text-lg text-white/60 mb-12 leading-relaxed">
            아직 구체적인 기획이 없으셔도 괜찮습니다.<br />
            편하게 문의 남겨주시면 함께 방향을 맞춰가겠습니다.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/60">
              <Mail size={20} />
              <span>visionary@portfolio.com</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <Instagram size={20} />
              <span>@visionary_edit</span>
            </div>
            <div className="flex items-center gap-4 text-white/60">
              <Youtube size={20} />
              <span>Visionary Studio</span>
            </div>
          </div>
        </div>

        <div className="p-10 glass rounded-[2rem]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Name</label>
                <input required name="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors" placeholder="홍길동" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Email</label>
                <input required name="email" type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors" placeholder="example@mail.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Phone</label>
                <input name="phone" type="tel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors" placeholder="010-0000-0000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Budget</label>
                <select name="budget" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors appearance-none">
                  <option className="bg-dark">협의 필요</option>
                  <option className="bg-dark">100만원 이하</option>
                  <option className="bg-dark">100만원 - 300만원</option>
                  <option className="bg-dark">300만원 이상</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Message</label>
              <textarea required name="message" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors resize-none" placeholder="의뢰하실 내용을 간략히 적어주세요."></textarea>
            </div>
            <button 
              disabled={status === 'loading'}
              className="w-full py-4 bg-white text-dark rounded-xl font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              {status === 'loading' ? '전송 중...' : status === 'success' ? '전송 완료!' : '문의 보내기'}
              {status === 'idle' && <ArrowRight size={18} />}
              {status === 'success' && <CheckCircle2 size={18} />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-xl font-bold tracking-tighter">빛소리미디어</div>
        <p className="text-white/30 text-xs uppercase tracking-widest">© 2026 빛소리미디어. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/admin" className="text-white/20 hover:text-white transition-colors"><Lock size={16} /></Link>
        </div>
      </div>
    </footer>
  );
};

const StickyFooter = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        >
          <a href="#contact" className="flex items-center gap-3 px-8 py-4 bg-white text-dark rounded-full font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform whitespace-nowrap">
            무료 견적 상담하기 <MessageSquare size={18} />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Pages ---

const Home = () => (
  <main>
    <Navbar />
    <Hero />
    <WorkSection />
    <AboutSection />
    <ProcessSection />
    <Testimonials />
    <ContactSection />
    <Footer />
    <StickyFooter />
  </main>
);

const WorkDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/portfolio/${id}`).then(res => res.json()).then(setItem);
    window.scrollTo(0, 0);
  }, [id]);

  if (!item) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen">
      <nav className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowRight className="rotate-180" size={20} /> 포트폴리오 목록으로
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">{item.category}</p>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-12">{item.title}</h1>
        
        <div className="aspect-video rounded-3xl overflow-hidden mb-20 bg-white/5">
          <img src={item.thumbnail} className="w-full h-full object-cover" alt={item.title} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="md:col-span-2 space-y-16">
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" /> 과제 및 목표
              </h2>
              <p className="text-2xl font-medium leading-relaxed">"{item.problem}"</p>
            </section>

            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white" /> 해결 과정 및 전략
              </h2>
              <p className="text-lg text-white/60 leading-relaxed whitespace-pre-line">{item.solution}</p>
            </section>
          </div>

          <div className="space-y-12">
            <div className="p-8 glass rounded-3xl">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">성과 및 결과</h2>
              <p className="text-xl font-bold mb-4">{item.result}</p>
              <div className="w-full h-px bg-white/10 mb-6" />
              <p className="text-sm text-white/40">기획력을 갖춘 작업자라는 강력한 신뢰를 바탕으로 프로젝트를 성공적으로 이끌었습니다.</p>
            </div>

            <a href="#contact" className="block w-full py-4 bg-white text-dark text-center rounded-2xl font-bold uppercase tracking-widest hover:bg-white/90 transition-all">
              비슷한 프로젝트 문의
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const Admin = () => {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'inquiries'>('portfolio');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (isAuth) {
      fetchItems();
      fetchInquiries();
    }
  }, [isAuth]);

  const fetchItems = () => {
    fetch('/api/portfolio').then(res => res.json()).then(setItems);
  };

  const fetchInquiries = () => {
    fetch('/api/admin/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    }).then(res => res.json()).then(setInquiries);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') setIsAuth(true);
    else alert('Wrong password');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/portfolio/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    fetchItems();
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = { ...Object.fromEntries(formData.entries()), password };
    
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    setShowAdd(false);
    fetchItems();
  };

  if (!isAuth) {
    return (
      <div className="h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="p-10 glass rounded-3xl w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <Lock className="mx-auto mb-4 opacity-50" size={48} />
            <h1 className="text-2xl font-bold">관리자 접속</h1>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
            placeholder="비밀번호"
          />
          <button className="w-full py-4 bg-white text-dark rounded-xl font-bold uppercase tracking-widest">로그인</button>
          <Link to="/" className="block text-center text-xs text-white/30 hover:text-white transition-colors">홈으로 돌아가기</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">관리자 페이지</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'portfolio' ? 'bg-white text-dark' : 'bg-white/5 text-white/40 hover:text-white'}`}
            >
              포트폴리오 관리
            </button>
            <button 
              onClick={() => setActiveTab('inquiries')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inquiries' ? 'bg-white text-dark' : 'bg-white/5 text-white/40 hover:text-white'}`}
            >
              문의 내역 확인
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          {activeTab === 'portfolio' && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-dark rounded-xl font-bold uppercase tracking-widest text-xs">
              <Plus size={16} /> 새 프로젝트 추가
            </button>
          )}
          <button onClick={() => setIsAuth(false)} className="px-6 py-3 glass rounded-xl font-bold uppercase tracking-widest text-xs">로그아웃</button>
        </div>
      </div>

      {activeTab === 'portfolio' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="glass rounded-2xl overflow-hidden group">
              <div className="aspect-video relative">
                <img src={item.thumbnail} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500 rounded-full hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{item.category}</p>
                <h3 className="font-bold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {inquiries.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl text-white/20">
              아직 접수된 문의가 없습니다.
            </div>
          ) : (
            inquiries.map(inquiry => (
              <div key={inquiry.id} className="glass rounded-3xl p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{inquiry.name}</h3>
                    <p className="text-sm text-white/40">{inquiry.email} | {inquiry.phone || '연락처 미기입'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/20 mb-1">Budget</p>
                    <p className="text-sm font-bold text-gold">{inquiry.budget}</p>
                  </div>
                </div>
                <div className="bg-white/5 rounded-2xl p-6">
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{inquiry.message}</p>
                </div>
                <div className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">
                  Received at: {new Date(inquiry.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass rounded-3xl w-full max-w-2xl p-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">새 프로젝트 추가</h2>
                <button onClick={() => setShowAdd(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">제목</label>
                    <input required name="title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40">카테고리</label>
                    <select name="category" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none">
                      <option className="bg-dark">유튜브 콘텐츠</option>
                      <option className="bg-dark">브랜드 홍보 영상</option>
                      <option className="bg-dark">숏폼</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">썸네일 URL</label>
                  <input required name="thumbnail" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none" placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">과제 및 목표</label>
                  <textarea name="problem" rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">해결 과정 및 전략</label>
                  <textarea name="solution" rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">성과 및 결과</label>
                  <input name="result" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none" />
                </div>
                <button className="w-full py-4 bg-white text-dark rounded-xl font-bold uppercase tracking-widest">프로젝트 저장</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:id" element={<WorkDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
