import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL is not defined");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function capitalizePersonName(value: string): string {
  return value
    .split(/([\s-]+)/)
    .map((part) => {
      if (/^[\s-]+$/.test(part)) return part;
      const [first = "", ...rest] = part;
      return first.toUpperCase() + rest.join("").toLowerCase();
    })
    .join("");
}

async function main() {
  console.log("Starting database seed...\n");

  // 1. SÉCURITÉ : Ne pas exécuter le seed si la base de données contient déjà des utilisateurs
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    console.log("La base de données est déjà peuplée. Annulation du seed pour éviter la perte de données.");
    return;
  }

  try {
    // 2. SÉCURITÉ : Ne JAMAIS vider les tables si on est en environnement de production
    if (process.env.NODE_ENV !== "production") {
      await prisma.messageReaction.deleteMany();
      await prisma.dmReaction.deleteMany();
      await prisma.message.deleteMany();
      await prisma.directMessage.deleteMany();
      await prisma.directConversation.deleteMany();
      await prisma.invite.deleteMany();
      await prisma.ban.deleteMany();
      await prisma.channel.deleteMany();
      await prisma.serverMember.deleteMany();
      await prisma.server.deleteMany();
      await prisma.user.deleteMany();
      console.log("Database cleaned\n");
    }
  } catch (error: any) {
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      throw new Error(
        "Database schema not found. Run `npx prisma db push` first.",
      );
    }
    throw error;
  }

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("Password123-", 10);

  const usersData = [
    { username: "Nadir", email: "nadir@epichat.com", status: "online" },
    { username: "Warith", email: "warith@epichat.com", status: "busy" },
    { username: "Younes", email: "younes@epichat.com", status: "away" },
    { username: "Michael", email: "michael@epichat.com", status: "online" },
    { username: "Pierre", email: "pierre@epichat.com", status: "offline" },
    { username: "Sophie", email: "sophie@epichat.com", status: "busy" },
    { username: "Lucas", email: "lucas@epichat.com", status: "offline" },
    { username: "Emma", email: "emma@epichat.com", status: "online" },
    { username: "Thomas", email: "thomas@epichat.com", status: "away" },
    { username: "Julie", email: "julie@epichat.com", status: "offline" },
  ];

  const users: Record<string, any> = {};

  for (const u of usersData) {
    users[u.username] = await prisma.user.create({
      data: {
        email: u.email,
        username: capitalizePersonName(u.username),
        passwordHash,
        status: u.status,
      },
    });
  }
  console.log("Users created.\n");

  const serverDefinitions = [
    {
      name: "Epitech Promo 2028",
      owner: "Nadir",
      members: [
        { name: "Warith", role: "admin" },
        { name: "Younes", role: "member" },
        { name: "Michael", role: "member" },
        { name: "Emma", role: "member" },
        { name: "Thomas", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Nadir", content: "Bienvenue sur le serveur de la promo ! 🎓" },
            { user: "Warith", content: "Wesh l'équipe !" },
            { user: "Emma", content: "Trop bien, merci pour l'invite ✨" },
            { user: "Younes", content: "On commence quand le C++ ? Je suis refait" },
            { user: "Nadir", content: "Lundi pro frérot, préparez-vous mentalement..." },
            { user: "Michael", content: "J'ai déjà peur, ça a l'air d'être un bourbier 😱" },
            { user: "Thomas", content: "Tkt ça va passer crème (non)" },
            { user: "Emma", content: "Quelqu'un a le lien du planning les bg ?" },
            { user: "Warith", content: "Sur l'intranet, section planning." },
            { user: "Pierre", content: "Yo tout le monde, j'arrive après la guerre" },
            { user: "Julie", content: "Coucou ! On est dans la même classe du coup ?" },
            { user: "Nadir", content: "Ouais normal, Epitech Promo 2028 on est là !" },
            { user: "Lucas", content: "Eh y'a qui qui a déjà codé en C avant ?" },
            { user: "Younes", content: "Moi un peu vite fait, mais y'a r" },
            { user: "Thomas", content: "Moi j'suis un crack (c'est faux)" },
            { user: "Michael", content: "Mdr Thomas tu vas pleurer au premier segfault" },
            { user: "Emma", content: "C'est quoi un segfault ?" },
            { user: "Warith", content: "💀💀💀" },
            { user: "Nadir", content: "Tu vas vite comprendre t'inquiète 😭" },
            { user: "Sophie", content: "Salut ! Désolée du retard j'avais pas vu l'invite" },
            { user: "Julie", content: "Bienvenue !!" },
            { user: "Lucas", content: "En vrai on fait une IRL avant la rentrée ?" },
            { user: "Michael", content: "Chaud de fou, on se capte où ?" },
            { user: "Nadir", content: "Go faire un bar sur Paname" },
            { user: "Younes", content: "Masterclass, on s'organise ça ce week-end ?" },
            { user: "Thomas", content: "Moi j'suis dispo tout le week-end, prévenez juste" },
            { user: "Emma", content: "Grave partante ! On fait un sondage pour le jour ?" },
            { user: "Warith", content: "Fais un Doodle ça sera plus simple" },
            { user: "Pierre", content: "Ouais vasy envoie le lien" },
            { user: "Nadir", content: "Je m'en occupe, je l'envoie dans 5 min" },
            { user: "Michael", content: "Bête de Délégué haha" },
            { user: "Nadir", content: "Tu connais 👑" },
          ],
        },
        {
          name: "projets",
          messages: [
            {
              user: "Michael",
              content: "Qui cherche un groupe pour le projet Web ?",
            },
            { user: "Thomas", content: "Moi ! Il me manque 2 personnes." },
            {
              user: "Younes",
              content: "Je suis chaud si vous faites du React.",
            },
            { user: "Michael", content: "Parfait, on part sur Next.js ?" },
            { user: "Thomas", content: "Go 🔥" },
            {
              user: "Nadir",
              content: "N'oubliez pas de vous inscrire sur le bot.",
            },
            { user: "Warith", content: "C'est fait pour nous." },
            { user: "Emma", content: "Nous on hésite encore sur le sujet." },
          ],
        },
        {
          name: "bde",
          messages: [
            {
              user: "Nadir",
              content: "Soirée d'inté prévue le 15, notez la date !",
            },
            { user: "Emma", content: "Trop cool ! Quel thème ?" },
            { user: "Nadir", content: "Années 80 🕺" },
            {
              user: "Michael",
              content: "Je vais ressortir mes chemises moches.",
            },
            { user: "Younes", content: "On peut aider pour l'orga ?" },
            {
              user: "Warith",
              content: "Oui on a besoin de staff pour le bar.",
            },
            { user: "Thomas", content: "Je suis dispo." },
            { user: "Emma", content: "Moi aussi !" },
          ],
        },
        {
          name: "off-topic",
          messages: [
            { user: "Younes", content: "Quelqu'un a vu le dernier Dune ?" },
            { user: "Michael", content: "Incroyable ce film." },
            { user: "Warith", content: "La musique de Zimmer... 🎵" },
            { user: "Thomas", content: "J'ai préféré le premier perso." },
            { user: "Emma", content: "Hérésie !" },
            { user: "Nadir", content: "On va manger où ce midi ?" },
            { user: "Younes", content: "Kebab comme d'hab ?" },
            { user: "Michael", content: "Chaud pour un BK." },
          ],
        },
        {
          name: "stage-alternance",
          messages: [
            {
              user: "Thomas",
              content: "Vous avez des pistes pour l'alternance ?",
            },
            {
              user: "Nadir",
              content: "J'ai un entretien chez Capgemini demain.",
            },
            { user: "Emma", content: "GG ! Moi je galère un peu." },
            {
              user: "Warith",
              content: "Regardez sur Welcome to the Jungle, y a des offres.",
            },
            { user: "Michael", content: "Merci pour le tuyau." },
            {
              user: "Younes",
              content: "Si vous voulez je connais une startup qui recrute.",
            },
            { user: "Thomas", content: "Envoie le lien en MP stp !" },
            { user: "Nadir", content: "Pareil je suis preneur." },
          ],
        },
        {
          // SCÉNARIO : Salon vide
          name: "annonces-importantes",
          messages: [],
        },
      ],
    },
    {
      name: "React Developers",
      owner: "Warith",
      members: [
        { name: "Nadir", role: "member" },
        { name: "Lucas", role: "member" },
        { name: "Pierre", role: "admin" },
        { name: "Julie", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Warith", content: "Welcome to the React community!" },
            { user: "Lucas", content: "Hello world! 👋" },
            { user: "Pierre", content: "React 19 arrive bientôt..." },
            { user: "Nadir", content: "Les Server Actions ça change la vie." },
            {
              user: "Julie",
              content: "J'ai encore du mal avec useEffect pers...",
            },
            { user: "Warith", content: "C'est normal au début, tkt." },
            {
              user: "Lucas",
              content: "Utilise React Query, c'est plus simple.",
            },
            { user: "Pierre", content: "SWR c'est bien aussi." },
          ],
        },
        {
          name: "help-react",
          messages: [
            {
              user: "Julie",
              content: "J'ai une erreur 'Too many re-renders', help !",
            },
            { user: "Nadir", content: "Montre ton code." },
            { user: "Julie", content: "Je set le state dans le render..." },
            {
              user: "Warith",
              content: "Ah bah cherche pas, mets le dans un useEffect.",
            },
            { user: "Julie", content: "Ah oui merci ! 🤦‍♀️" },
            { user: "Pierre", content: "Classique." },
            { user: "Lucas", content: "On est tous passés par là." },
            { user: "Nadir", content: "Utilise le linter ça aide." },
          ],
        },
        {
          name: "showcase",
          messages: [
            { user: "Lucas", content: "Grosse update de mon portfolio !" },
            { user: "Warith", content: "Lien ?" },
            { user: "Lucas", content: "lucas-dev.com, checkez ça." },
            { user: "Pierre", content: "Propre les animations Framer Motion." },
            { user: "Nadir", content: "J'aime bien le dark mode." },
            { user: "Julie", content: "C'est fluide, GG." },
            { user: "Lucas", content: "Merci ! C'était galère le responsive." },
            { user: "Warith", content: "Ça rend bien sur mobile aussi." },
          ],
        },
        {
          name: "jobs",
          messages: [
            {
              user: "Warith",
              content: "Ma boite cherche un Lead Dev React, full remote.",
            },
            { user: "Pierre", content: "Stack ?" },
            { user: "Warith", content: "Next.js, TypeScript, Tailwind." },
            { user: "Nadir", content: "Le rêve." },
            { user: "Lucas", content: "Je peux postuler en junior ?" },
            { user: "Warith", content: "Envoie ton CV on sait jamais." },
            { user: "Julie", content: "Salaire ?" },
            { user: "Warith", content: "55-65k selon expérience." },
          ],
        },
      ],
    },
    {
      name: "Gaming Lounge",
      owner: "Younes",
      members: [
        { name: "Nadir", role: "member" },
        { name: "Warith", role: "member" },
        { name: "Michael", role: "admin" },
        { name: "Pierre", role: "member" },
        { name: "Sophie", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Younes", content: "Yo les gamers !" },
            { user: "Sophie", content: "Salut !" },
            { user: "Nadir", content: "Qui joue ce soir ?" },
            { user: "Michael", content: "Dispo vers 21h." },
            {
              user: "Warith",
              content: "Je dois finir un projet mais après chaud.",
            },
            { user: "Pierre", content: "Nouvelle saison Fortnite ?" },
            { user: "Younes", content: "Non merci, plutôt Valorant." },
            { user: "Sophie", content: "Team LoL ici ✋" },
          ],
        },
        {
          name: "fps",
          messages: [
            { user: "Younes", content: "CS2 c'est comment ?" },
            { user: "Nadir", content: "Pas mal mais quelques bugs." },
            { user: "Michael", content: "Valorant > CS, change my mind." },
            { user: "Pierre", content: "Le débat sans fin..." },
            { user: "Younes", content: "Qui pour une ranked Valo ?" },
            { user: "Sophie", content: "Je suis Bronze, vous m'acceptez ?" },
            { user: "Nadir", content: "Vasy on carry." },
            { user: "Michael", content: "Je prends Sage." },
          ],
        },
        {
          name: "rpg",
          messages: [
            { user: "Warith", content: "J'ai relancé Witcher 3, quel banger." },
            {
              user: "Pierre",
              content: "Le DLC Blood and Wine est incroyable.",
            },
            { user: "Younes", content: "Baldur's Gate 3 goty." },
            {
              user: "Nadir",
              content: "J'ai 200h dessus j'ai toujours pas fini l'acte 3.",
            },
            { user: "Sophie", content: "Moi je suis sur Zelda TOTK." },
            { user: "Michael", content: "Elden Ring m'a brisé." },
            { user: "Warith", content: "Malenia..." },
            { user: "Pierre", content: "Let me solo her." },
          ],
        },
        {
          name: "setup-pics",
          messages: [
            { user: "Younes", content: "Nouveau clavier reçu ! Keychron K2." },
            { user: "Nadir", content: "Propre, switches brown ?" },
            { user: "Younes", content: "Red, pour le gaming." },
            { user: "Sophie", content: "J'adore ton tapis de souris." },
            {
              user: "Michael",
              content: "Faut que je change mon écran, des conseils ?",
            },
            { user: "Warith", content: "LG Ultragear, une valeur sûre." },
            { user: "Pierre", content: "Ou Odyssey G7 si t'as le budget." },
            { user: "Michael", content: "Je vais check ça merci." },
          ],
        },
      ],
    },
    {
      name: "Cinephiles Club",
      owner: "Michael",
      members: [
        { name: "Emma", role: "member" },
        { name: "Thomas", role: "member" },
        { name: "Julie", role: "admin" },
        { name: "Sophie", role: "member" },
        { name: "Nadir", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Michael", content: "Bienvenue au club !" },
            { user: "Emma", content: "Hello !" },
            { user: "Julie", content: "Chouette initiative." },
            { user: "Thomas", content: "On parle de quoi aujourd'hui ?" },
            { user: "Sophie", content: "Les Oscars ?" },
            { user: "Michael", content: "Grosse déception pour ma part." },
            { user: "Emma", content: "Pareil, trop prévisible." },
            { user: "Julie", content: "Au moins la réalisation était belle." },
          ],
        },
        {
          name: "recommendations",
          messages: [
            {
              user: "Thomas",
              content: "Je cherche un thriller psychologique.",
            },
            { user: "Michael", content: "Shutter Island, classique." },
            { user: "Emma", content: "Gone Girl !" },
            { user: "Sophie", content: "Prisoners de Denis Villeneuve." },
            { user: "Thomas", content: "Déjà vus tous les trois..." },
            { user: "Julie", content: "The Game (Fincher) ?" },
            { user: "Thomas", content: "Ah non, je note." },
            { user: "Michael", content: "Tu vas adorer." },
          ],
        },
        {
          name: "series",
          messages: [
            { user: "Emma", content: "Succession c'est fini... 😭" },
            { user: "Sophie", content: "Quelle fin magistrale." },
            { user: "Julie", content: "Je viens de commencer Severance." },
            { user: "Michael", content: "Incroyable cette série, l'ambiance." },
            { user: "Thomas", content: "The Bear saison 2, une tuerie." },
            { user: "Emma", content: "Oui !! Cousin !!" },
            { user: "Michael", content: "J'ai faim à chaque épisode." },
            { user: "Sophie", content: "Pareil haha." },
          ],
        },
        {
          name: "sorties-cinema",
          messages: [
            {
              user: "Michael",
              content: "Qui pour aller voir le nouveau Nolan ?",
            },
            { user: "Thomas", content: "Chaud ! Imax ?" },
            { user: "Julie", content: "Obligé l'Imax pour Nolan." },
            { user: "Emma", content: "Je suis dispo mardi." },
            { user: "Sophie", content: "Moi aussi." },
            { user: "Michael", content: "Vas pour mardi 20h alors." },
            { user: "Thomas", content: "Je prends les places ?" },
            { user: "Emma", content: "Oui stp, on te rembourse." },
          ],
        },
      ],
    },
    {
      name: "Hiking Adventures",
      owner: "Pierre",
      members: [
        { name: "Lucas", role: "admin" },
        { name: "Julie", role: "member" },
        { name: "Sophie", role: "member" },
        { name: "Thomas", role: "member" },
        { name: "Emma", role: "member" },
        { name: "Warith", role: "member" },
        { name: "Younes", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Pierre", content: "Salut les randonneurs !" },
            { user: "Lucas", content: "Prêts pour grimper ?" },
            { user: "Julie", content: "Toujours !" },
            { user: "Sophie", content: "Ça manque d'air frais ici." },
            { user: "Thomas", content: "Effectivement." },
            { user: "Emma", content: "J'ai besoin de voir des arbres." },
            { user: "Pierre", content: "On va organiser ça." },
            { user: "Lucas", content: "Yes !" },
          ],
        },
        {
          name: "sentiers",
          messages: [
            {
              user: "Julie",
              content: "Des idées pour ce week-end ? Pas trop dur svp.",
            },
            {
              user: "Pierre",
              content: "Le Vercors c'est sympa et accessible.",
            },
            { user: "Emma", content: "Les Calanques ?" },
            { user: "Thomas", content: "Trop de monde..." },
            { user: "Sophie", content: "Chartreuse sinon." },
            { user: "Lucas", content: "La Dent de Crolles ?" },
            {
              user: "Pierre",
              content: "Un peu technique pour une reprise non ?",
            },
            { user: "Julie", content: "Oui on va éviter si possible haha." },
          ],
        },
        {
          name: "matos",
          messages: [
            { user: "Thomas", content: "Je dois changer mes chaussures." },
            { user: "Lucas", content: "Salomon c'est la valeur sûre." },
            {
              user: "Emma",
              content: "Merrell c'est bien aussi, très confort.",
            },
            {
              user: "Pierre",
              content: "Prends des tiges hautes si tu fais du caillou.",
            },
            { user: "Thomas", content: "Ok je note." },
            { user: "Sophie", content: "Et des bons bâtons ça change la vie." },
            {
              user: "Julie",
              content: "Clairement, pour les genoux en descente.",
            },
            {
              user: "Thomas",
              content: "Je vais faire un tour au vieux campeur.",
            },
          ],
        },
        {
          name: "photos",
          messages: [
            {
              user: "Pierre",
              content: "Petite photo de ma sortie hier au Mont Blanc.",
            },
            { user: "Julie", content: "Wouah la vue !" },
            { user: "Lucas", content: "Magnifique." },
            { user: "Emma", content: "Ça donne envie." },
            { user: "Sophie", content: "C'est beau la montagne." },
            { user: "Thomas", content: "Il faisait beau en plus." },
            { user: "Pierre", content: "Grand soleil oui." },
            { user: "Lucas", content: "La chance." },
          ],
        },
      ],
    },
    {
      name: "Startup Nation",
      owner: "Sophie",
      members: [
        { name: "Nadir", role: "admin" },
        { name: "Warith", role: "member" },
        { name: "Lucas", role: "member" },
        { name: "Julie", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Sophie", content: "Welcome founders & dreamers." },
            { user: "Nadir", content: "Hello la team." },
            { user: "Warith", content: "Prêts à disrupter le marché ?" },
            { user: "Lucas", content: "Always." },
            { user: "Julie", content: "Des événements prévus ?" },
            { user: "Sophie", content: "Oui, un afterwork jeudi." },
            { user: "Nadir", content: "Je serai là." },
            { user: "Warith", content: "Moi aussi." },
          ],
        },
        {
          name: "ideas",
          messages: [
            {
              user: "Lucas",
              content: "J'ai une idée d'app : Tinder pour les cofondateurs.",
            },
            { user: "Julie", content: "Ça existe déjà non ?" },
            { user: "Nadir", content: "Y Combinator a un truc comme ça." },
            { user: "Lucas", content: "Ah mince." },
            {
              user: "Warith",
              content: "L'exécution compte plus que l'idée 😉",
            },
            { user: "Sophie", content: "Exactement." },
            { user: "Lucas", content: "Je vais pivoter alors." },
            { user: "Nadir", content: "Uber pour les tondeuses." },
          ],
        },
        {
          name: "funding",
          messages: [
            {
              user: "Warith",
              content: "Les taux remontent, c'est dur de lever.",
            },
            { user: "Sophie", content: "Faut être rentable plus vite." },
            { user: "Nadir", content: "Le bootstrapping c'est la vie." },
            { user: "Julie", content: "Ou la BPI ?" },
            {
              user: "Lucas",
              content: "Bourse French Tech ça aide bien au début.",
            },
            { user: "Warith", content: "Oui on a eu la subvention." },
            { user: "Sophie", content: "Faut préparer un bon pitch deck." },
            { user: "Nadir", content: "Je peux relire si vous voulez." },
          ],
        },
        {
          name: "tech-news",
          messages: [
            { user: "Julie", content: "Vous avez vu la conf d'OpenAI ?" },
            { user: "Lucas", content: "Sora c'est effrayant." },
            { user: "Nadir", content: "Mais fascinant." },
            { user: "Warith", content: "Ça va changer pas mal de métiers." },
            {
              user: "Sophie",
              content: "Faut qu'on intégre l'IA dans nos produits.",
            },
            { user: "Nadir", content: "C'est déjà le cas haha." },
            { user: "Lucas", content: "Tout est 'AI powered' maintenant." },
            { user: "Julie", content: "C'est le mot magique pour les VCs." },
          ],
        },
      ],
    },
    {
      name: "Creative Arts",
      owner: "Emma",
      members: [
        { name: "Sophie", role: "admin" },
        { name: "Julie", role: "member" },
        { name: "Nadir", role: "member" },
        { name: "Thomas", role: "member" }
      ],
      channels: [
        {
          name: "general",
          messages: [
            { user: "Emma", content: "Bienvenue aux créatifs ! 🎨" },
            { user: "Sophie", content: "Super idée ce serveur." },
            { user: "Julie", content: "J'ai hâte de voir vos oeuvres." },
            { user: "Nadir", content: "Je dessine un peu, je vous montrerai." },
            { user: "Thomas", content: "Moi c'est la musique." },
            { user: "Emma", content: "Génial, partage-nous ça !" },
          ]
        },
        {
          name: "inspiration",
          messages: [
            { user: "Sophie", content: "Vous avez des artistes préférés en ce moment ?" },
            { user: "Julie", content: "Je regarde beaucoup le travail de Moebius." },
            { user: "Nadir", content: "Incroyable, j'adore son trait." },
            { user: "Thomas", content: "Moi c'est plus la photo, j'aime bien Vivian Maier." },
            { user: "Emma", content: "Une légende ! J'adore ses autoportraits." },
          ]
        },
        {
          name: "projets-en-cours",
          messages: [
            { user: "Nadir", content: "Je bosse sur un petit court-métrage." },
            { user: "Sophie", content: "Sérieux ? En animation ou prise de vue réelle ?" },
            { user: "Nadir", content: "Animation 2D, ça prend un temps fou..." },
            { user: "Emma", content: "Courage ! N'hésite pas si tu as besoin de retours." },
            { user: "Julie", content: "Je peux aider pour le sound design si besoin." },
            { user: "Nadir", content: "Carrément, je te DM !" },
          ]
        }
      ]
    },
    {
      // SCÉNARIO : Serveur vide (aucun salon, mais tous les membres pour tester l'interface membres)
      name: "Empty Server Test",
      owner: "Nadir",
      members: [
        { name: "Warith", role: "admin" },
        { name: "Younes", role: "admin" },
        { name: "Michael", role: "member" },
        { name: "Pierre", role: "member" },
        { name: "Sophie", role: "member" },
        { name: "Lucas", role: "member" },
        { name: "Emma", role: "member" },
        { name: "Thomas", role: "member" },
        { name: "Julie", role: "member" }
      ],
      channels: [],
    },
  ];

  for (const s of serverDefinitions) {
    console.log(`Creating server: ${s.name}`);

    const server = await prisma.server.create({
      data: {
        name: s.name,
        ownerId: users[s.owner].id,
      },
    });

    await prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId: users[s.owner].id,
        role: "owner",
      },
    });

    for (const member of s.members) {
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: users[member.name].id,
          role: member.role,
        },
      });
    }

    for (const c of s.channels) {
      const channel = await prisma.channel.create({
        data: {
          serverId: server.id,
          name: c.name,
          createdBy: users[s.owner].id,
        },
      });

      for (const m of c.messages) {
        await prisma.message.create({
          data: {
            channelId: channel.id,
            authorId: users[m.user].id,
            content: m.content,
          },
        });
      }
    }
  }

  console.log("Servers & Content created.\n");

  console.log("Creating invites...");

  const serverPromo = await prisma.server.findFirst({
    where: { name: "Epitech Promo 2028" },
  });
  if (serverPromo) {
    await prisma.invite.create({
      data: {
        serverId: serverPromo.id,
        code: "EPITECH",
        createdBy: users["Nadir"].id,
        maxUses: 100,
        uses: 0,
      },
    });
  }

  const serverGaming = await prisma.server.findFirst({
    where: { name: "Gaming Lounge" },
  });
  if (serverGaming) {
    await prisma.invite.create({
      data: {
        serverId: serverGaming.id,
        code: "GAMING",
        createdBy: users["Younes"].id,
        maxUses: 50,
        uses: 0,
      },
    });
  }

  // SCÉNARIO : Invitation expirée (limite d'utilisation atteinte)
  if (serverPromo) {
    await prisma.invite.create({
      data: {
        serverId: serverPromo.id,
        code: "EXPIRED",
        createdBy: users["Nadir"].id,
        maxUses: 1,
        uses: 1,
      },
    });
  }

  // SCÉNARIO : Test de pagination (générer 50 messages dans un seul salon)
  const channelToSpam = await prisma.channel.findFirst({
    where: { name: "general", server: { name: "Gaming Lounge" } }
  });
  if (channelToSpam) {
    console.log("Generating 50 messages for pagination test...");
    const baseTime = Date.now();
    const spamData = Array.from({ length: 50 }).map((_, i) => ({
      channelId: channelToSpam.id,
      authorId: users["Younes"].id,
      content: `Message de test pour la pagination ${i + 1}`,
      createdAt: new Date(baseTime + i * 1000),
    }));
    await prisma.message.createMany({ data: spamData });
  }

  // --- DIRECT MESSAGES ---
  console.log("Creating Direct Messages...");

  const dmPairs = [
    { p1: "Nadir", p2: "Warith", msgs: [
      { author: "Nadir", content: "Salut Warith, tu as pu regarder mon PR ?" },
      { author: "Warith", content: "Hey ! Oui je suis en train, ça a l'air clean." },
      { author: "Nadir", content: "Super, dis moi s'il y a des trucs à refacto." },
      { author: "Warith", content: "Ça marche, je te fais un retour d'ici 30 minutes." }
    ]},
    { p1: "Nadir", p2: "Emma", msgs: [
      { author: "Emma", content: "Hey Nadir ! T'as avancé sur le projet ?" },
      { author: "Nadir", content: "Coucou ! Ouais j'ai fini la partie auth, je push bientôt" },
      { author: "Emma", content: "Masterclass, on teste ça demain alors" },
      { author: "Nadir", content: "Go 🚀" }
    ]},
    { p1: "Nadir", p2: "Michael", msgs: [
      { author: "Nadir", content: "Wesh t'es op pour une game ce soir ?" },
      { author: "Michael", content: "De fou frérot, vers 21h ça te va ?" },
      { author: "Nadir", content: "Carré, je serai sur discord" }
    ]},
    { p1: "Nadir", p2: "Thomas", msgs: [
      { author: "Thomas", content: "Mec, j'arrive pas à build le projet..." },
      { author: "Nadir", content: "T'as bien fait npm install ?" },
      { author: "Thomas", content: "Ah merde, j'avais oublié mdr" },
      { author: "Nadir", content: "Tu me fumes 😭" }
    ]},
    { p1: "Nadir", p2: "Younes", msgs: [
      { author: "Nadir", content: "Yo bg, tu viens manger au ruu ce midi ?" },
      { author: "Younes", content: "Vasy chaud, on se capte devant à 12h30" },
      { author: "Nadir", content: "Parfait à toute" }
    ]},
    { p1: "Nadir", p2: "Sophie", msgs: [
      { author: "Nadir", content: "Hello Sophie, j'ai vu ta dernière maquette, c'est super lourd !" },
      { author: "Sophie", content: "Merci Nadir ! J'ai pas mal bossé sur les couleurs, t'en penses quoi ?" },
      { author: "Nadir", content: "Le contraste est dingue, on garde ça direct." }
    ]},
    { p1: "Emma", p2: "Julie", msgs: [
      { author: "Emma", content: "Coucou ! Tu viens à la soirée demain ?" },
      { author: "Julie", content: "Hello ! Oui carrément, on s'y retrouve vers 20h ?" },
      { author: "Emma", content: "Parfait, à demain alors !" }
    ]},
    { p1: "Michael", p2: "Younes", msgs: [
      { author: "Michael", content: "Yo, on lance une game ce soir ?" },
      { author: "Younes", content: "Chaud ! Vers quelle heure ?" },
      { author: "Michael", content: "Je finis le taf à 19h, disons 20h le temps de manger." },
      { author: "Younes", content: "Nickel, on se capte sur discord." }
    ]},
    { p1: "Sophie", p2: "Pierre", msgs: [
      { author: "Sophie", content: "Hello Pierre, tu as le lien de la réunion de 14h ?" },
      { author: "Pierre", content: "Salut Sophie, oui tiens : meet.google.com/abc-defg-hij" },
      { author: "Sophie", content: "Merci beaucoup !" },
    ]},
    { p1: "Thomas", p2: "Lucas", msgs: [
      { author: "Thomas", content: "Dis, tu as réussi à faire marcher Docker sur ton mac ?" },
      { author: "Lucas", content: "Non galère totale... ça crash en boucle." },
      { author: "Thomas", content: "Pareil, j'en peux plus." },
    ]}
  ];

  for (const pair of dmPairs) {
    const u1 = users[pair.p1];
    const u2 = users[pair.p2];

    const dmConv = await prisma.directConversation.create({
      data: {
        participant1Id: u1.id,
        participant2Id: u2.id,
      }
    });

    for (let i = 0; i < pair.msgs.length; i++) {
      const msg = pair.msgs[i];
      const createdMsg = await prisma.directMessage.create({
        data: {
          conversationId: dmConv.id,
          authorId: users[msg.author].id,
          content: msg.content,
        }
      });
      
      if (i === 1 && msg.author !== pair.p1) {
        await prisma.dmReaction.create({
          data: {
            directMessageId: createdMsg.id,
            userId: u1.id,
            emoji: "👍"
          }
        });
      }
    }
  }

  // --- REACTIONS SUR LES MESSAGES DE SALON ---
  console.log("Adding reactions to some channel messages...");
  
  const allMessages = await prisma.message.findMany({
    where: {
      content: {
        not: {
          startsWith: "Message de test pour la pagination"
        }
      }
    },
    take: 300
  });

  const emojis = ["🔥", "😂", "❤️", "👍", "👀", "💯", "💀", "😭", "✨", "👑"];
  const userKeys = Object.keys(users);

  for (const msg of allMessages) {
    // 40% chance to have a reaction
    if (Math.random() < 0.4) {
      const randomUser1 = userKeys[Math.floor(Math.random() * userKeys.length)];
      const randomEmoji1 = emojis[Math.floor(Math.random() * emojis.length)];
      try {
        await prisma.messageReaction.create({
          data: {
            messageId: msg.id,
            userId: users[randomUser1].id,
            emoji: randomEmoji1,
          }
        });
        
        // 30% chance for a second reaction
        if (Math.random() < 0.3) {
          const randomUser2 = userKeys[Math.floor(Math.random() * userKeys.length)];
          const randomEmoji2 = emojis[Math.floor(Math.random() * emojis.length)];
          if (randomUser1 !== randomUser2 || randomEmoji1 !== randomEmoji2) {
            await prisma.messageReaction.create({
              data: {
                messageId: msg.id,
                userId: users[randomUser2].id,
                emoji: randomEmoji2,
              }
            });
          }
        }
      } catch (e) {
        // Ignorer silencieusement si la contrainte unique est violée
      }
    }
  }

  console.log("Seed completed successfully\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
