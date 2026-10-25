import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import Marquee from './sections/Marquee';
import About from './sections/About';
import Projects from './sections/Projects';
import Notes from './sections/Notes';
import Location from './sections/Location';
import Faq from './sections/Faq';
import Team from './sections/Team';
import RecruitmentPage from './pages/RecruitmentPage';
import NotFoundPage from './pages/NotFoundPage';
import { usePath, jumpTo, isKnownPath } from './router.jsx';
import { useReveal } from './hooks';
import { STUDIO_NAME } from './config';

export default function App() {
  const path = usePath();
  useReveal(path);

  // After changing page: go to the #section in the URL, or to the top.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    jumpTo(id ? document.getElementById(id) : null);
  }, [path]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="flex-1" aria-label={STUDIO_NAME}>
        {!isKnownPath(path) ? (
          <NotFoundPage />
        ) : path === '/recruitment' ? (
          <RecruitmentPage />
        ) : (
          <>
            <Hero />
            <Marquee />
            <About />
            <Projects />
            <Notes />
            <Location />
            <Faq />
            <Team />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
