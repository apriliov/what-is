import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import Marquee from './sections/Marquee';
import About from './sections/About';
import Projects from './sections/Projects';
import Notes from './sections/Notes';
import Location from './sections/Location';
import Faq from './sections/Faq';
import { STUDIO_NAME } from './config';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1" aria-label={STUDIO_NAME}>
        <Hero />
        <Marquee />
        <About />
        <Projects />
        <Notes />
        <Location />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
