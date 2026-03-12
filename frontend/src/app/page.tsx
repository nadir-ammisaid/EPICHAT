import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import HomeSection from "@/components/home/Section";
import Footer from "@/components/home/Footer";
import RedirectIfAuthed from "@/components/dashboard/RedirectIfAuthed";

export default function HomePage() {
  return (
    <>
      <RedirectIfAuthed />
      <Header />
      <main>
        <Hero />
        <HomeSection
          id="pourquoi"
          title="Pourquoi EpiChat ?"
          description="Organisez vos échanges par serveurs et canaux, gardez un historique clair, et discutez sans friction en équipe."
          imageSrc="/sections/why.png"
          imageAlt="Pourquoi EpiChat"
        />
        <HomeSection
          id="fonctionnalites"
          title="Fonctionnalités"
          description="Canaux, messages instantanés, organisation simple… tout ce qu’il faut pour un chat moderne et efficace."
          imageSrc="/sections/features.png"
          imageAlt="Fonctionnalités"
          reverse
        />
        <HomeSection
          id="securite"
          title="Sécurité & accès"
          description="Authentification, routes protégées et contrôle d’accès : vous gardez la main sur qui peut voir et faire quoi."
          imageSrc="/sections/security.png"
          imageAlt="Sécurité"
        />
        <HomeSection
          id="pourqui"
          title="Pour qui ?"
          description="Groupes de travail, communautés, projets… dès que vous avez besoin d’échanger vite et de rester organisé."
          imageSrc="/sections/forwho.png"
          imageAlt="Pour qui"
          reverse
        />
      </main>
      <Footer />
    </>
  );
}
