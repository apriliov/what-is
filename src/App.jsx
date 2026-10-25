import Navbar from './components/Navbar';
import Footer from './components/Footer';
import StickyBar from './components/StickyBar';
import Hero from './sections/Hero';
import About from './sections/About';
import Projects from './sections/Projects';
import Location from './sections/Location';
import Faq from './sections/Faq';
import { STUDIO_NAME } from './config';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden pb-14">
      <Navbar />
      <main className="flex-1" aria-label={STUDIO_NAME}>
        <Hero />
        <About />
        <Projects />
        <Location />
        <Faq />
      </main>
      <Footer />
      <StickyBar />
    </div>
  );
}
