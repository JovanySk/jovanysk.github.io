import { CommandPalette } from "@/components/command-palette";
import { Backdrop } from "@/journey/backdrop";
import { Hud } from "@/journey/hud";
import { Loader } from "@/journey/loader";
import { LogoMarquee, LogoSprite, skillLogos } from "@/journey/logos";
import { Intro, ZoneAi, ZoneBackend, ZoneContact, ZoneIntesc, ZoneStack, ZoneSystems } from "@/journey/sections";

// "A journey through latent space": a fixed WebGL scene behind real HTML sections.
// Logos are rendered here, on the server, so simple-icons never reaches the client bundle.
export default function Home() {
  return (
    <div id="journey">
      <LogoSprite />
      <Loader />
      <Backdrop />
      <Hud />
      <main id="main" className="relative z-10 overflow-x-clip">
        <Intro />
        <ZoneIntesc />
        <ZoneAi />
        <ZoneBackend />
        <ZoneSystems />
        <ZoneStack marquee={<LogoMarquee />} logos={skillLogos()} />
        <ZoneContact />
      </main>
      <CommandPalette />
    </div>
  );
}
