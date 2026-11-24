import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { MoreProjects } from "@/components/more-projects";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Education } from "@/components/education";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { CommandPalette } from "@/components/command-palette";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="overflow-x-clip">
        <Hero />
        <Projects />
        <MoreProjects />
        <Experience />
        <Skills />
        <Education />
        <Contact />
      </main>
      <Footer />
      <CommandPalette />
    </>
  );
}
