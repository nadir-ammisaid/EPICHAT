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

async function main() {
  console.log("Starting database seed...\n");

  try {
    await prisma.message.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.serverMember.deleteMany();
    await prisma.server.deleteMany();
    await prisma.user.deleteMany();
    console.log("Database cleaned\n");
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
    { username: "nadir", email: "nadir@epichat.com" },
    { username: "warith", email: "warith@epichat.com" },
    { username: "younes", email: "younes@epichat.com" },
    { username: "michael", email: "michael@epichat.com" },
    { username: "pierre", email: "pierre@epichat.com" },
    { username: "sophie", email: "sophie@epichat.com" },
    { username: "lucas", email: "lucas@epichat.com" },
    { username: "emma", email: "emma@epichat.com" },
    { username: "thomas", email: "thomas@epichat.com" },
    { username: "julie", email: "julie@epichat.com" },
  ];

  const users: Record<string, any> = {};

  for (const u of usersData) {
    users[u.username] = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        passwordHash,
        status: "offline",
      },
    });
  }
  console.log("Users created.\n");

  const serverDefinitions = [
    {
      name: "Epitech Promo 2028",
      owner: "nadir",
      members: ["warith", "younes", "michael", "emma", "thomas"],
      channels: [
        {
          name: "general",
          messages: [
            {
              user: "nadir",
              content: "Bienvenue sur le serveur de la promo ! 🎓",
            },
            { user: "warith", content: "Salut tout le monde !" },
            { user: "emma", content: "Trop bien, merci pour l'invite." },
            { user: "younes", content: "On commence quand le C++ ?" },
            { user: "nadir", content: "Lundi prochain, préparez-vous..." },
            { user: "michael", content: "J'ai déjà peur 😱" },
            { user: "thomas", content: "Tkt ça va bien se passer (non)" },
            { user: "emma", content: "Quelqu'un a le lien du planning ?" },
            { user: "warith", content: "Sur l'intranet, section planning." },
          ],
        },
        {
          name: "projets",
          messages: [
            {
              user: "michael",
              content: "Qui cherche un groupe pour le projet Web ?",
            },
            { user: "thomas", content: "Moi ! Il me manque 2 personnes." },
            {
              user: "younes",
              content: "Je suis chaud si vous faites du React.",
            },
            { user: "michael", content: "Parfait, on part sur Next.js ?" },
            { user: "thomas", content: "Go 🔥" },
            {
              user: "nadir",
              content: "N'oubliez pas de vous inscrire sur le bot.",
            },
            { user: "warith", content: "C'est fait pour nous." },
            { user: "emma", content: "Nous on hésite encore sur le sujet." },
          ],
        },
        {
          name: "bde",
          messages: [
            {
              user: "nadir",
              content: "Soirée d'inté prévue le 15, notez la date !",
            },
            { user: "emma", content: "Trop cool ! Quel thème ?" },
            { user: "nadir", content: "Années 80 🕺" },
            {
              user: "michael",
              content: "Je vais ressortir mes chemises moches.",
            },
            { user: "younes", content: "On peut aider pour l'orga ?" },
            {
              user: "warith",
              content: "Oui on a besoin de staff pour le bar.",
            },
            { user: "thomas", content: "Je suis dispo." },
            { user: "emma", content: "Moi aussi !" },
          ],
        },
        {
          name: "off-topic",
          messages: [
            { user: "younes", content: "Quelqu'un a vu le dernier Dune ?" },
            { user: "michael", content: "Incroyable ce film." },
            { user: "warith", content: "La musique de Zimmer... 🎵" },
            { user: "thomas", content: "J'ai préféré le premier perso." },
            { user: "emma", content: "Hérésie !" },
            { user: "nadir", content: "On va manger où ce midi ?" },
            { user: "younes", content: "Kebab comme d'hab ?" },
            { user: "michael", content: "Chaud pour un BK." },
          ],
        },
        {
          name: "stage-alternance",
          messages: [
            {
              user: "thomas",
              content: "Vous avez des pistes pour l'alternance ?",
            },
            {
              user: "nadir",
              content: "J'ai un entretien chez Capgemini demain.",
            },
            { user: "emma", content: "GG ! Moi je galère un peu." },
            {
              user: "warith",
              content: "Regardez sur Welcome to the Jungle, y a des offres.",
            },
            { user: "michael", content: "Merci pour le tuyau." },
            {
              user: "younes",
              content: "Si vous voulez je connais une startup qui recrute.",
            },
            { user: "thomas", content: "Envoie le lien en MP stp !" },
            { user: "nadir", content: "Pareil je suis preneur." },
          ],
        },
      ],
    },
    {
      name: "React Developers",
      owner: "warith",
      members: ["nadir", "lucas", "pierre", "julie"],
      channels: [
        {
          name: "general",
          messages: [
            { user: "warith", content: "Welcome to the React community!" },
            { user: "lucas", content: "Hello world! 👋" },
            { user: "pierre", content: "React 19 arrive bientôt..." },
            { user: "nadir", content: "Les Server Actions ça change la vie." },
            {
              user: "julie",
              content: "J'ai encore du mal avec useEffect pers...",
            },
            { user: "warith", content: "C'est normal au début, tkt." },
            {
              user: "lucas",
              content: "Utilise React Query, c'est plus simple.",
            },
            { user: "pierre", content: "SWR c'est bien aussi." },
          ],
        },
        {
          name: "help-react",
          messages: [
            {
              user: "julie",
              content: "J'ai une erreur 'Too many re-renders', help !",
            },
            { user: "nadir", content: "Montre ton code." },
            { user: "julie", content: "Je set le state dans le render..." },
            {
              user: "warith",
              content: "Ah bah cherche pas, mets le dans un useEffect.",
            },
            { user: "julie", content: "Ah oui merci ! 🤦‍♀️" },
            { user: "pierre", content: "Classique." },
            { user: "lucas", content: "On est tous passés par là." },
            { user: "nadir", content: "Utilise le linter ça aide." },
          ],
        },
        {
          name: "showcase",
          messages: [
            { user: "lucas", content: "Grosse update de mon portfolio !" },
            { user: "warith", content: "Lien ?" },
            { user: "lucas", content: "lucas-dev.com, checkez ça." },
            { user: "pierre", content: "Propre les animations Framer Motion." },
            { user: "nadir", content: "J'aime bien le dark mode." },
            { user: "julie", content: "C'est fluide, GG." },
            { user: "lucas", content: "Merci ! C'était galère le responsive." },
            { user: "warith", content: "Ça rend bien sur mobile aussi." },
          ],
        },
        {
          name: "jobs",
          messages: [
            {
              user: "warith",
              content: "Ma boite cherche un Lead Dev React, full remote.",
            },
            { user: "pierre", content: "Stack ?" },
            { user: "warith", content: "Next.js, TypeScript, Tailwind." },
            { user: "nadir", content: "Le rêve." },
            { user: "lucas", content: "Je peux postuler en junior ?" },
            { user: "warith", content: "Envoie ton CV on sait jamais." },
            { user: "julie", content: "Salaire ?" },
            { user: "warith", content: "55-65k selon expérience." },
          ],
        },
      ],
    },
    {
      name: "Gaming Lounge",
      owner: "younes",
      members: ["nadir", "warith", "michael", "pierre", "sophie"],
      channels: [
        {
          name: "general",
          messages: [
            { user: "younes", content: "Yo les gamers !" },
            { user: "sophie", content: "Salut !" },
            { user: "nadir", content: "Qui joue ce soir ?" },
            { user: "michael", content: "Dispo vers 21h." },
            {
              user: "warith",
              content: "Je dois finir un projet mais après chaud.",
            },
            { user: "pierre", content: "Nouvelle saison Fortnite ?" },
            { user: "younes", content: "Non merci, plutôt Valorant." },
            { user: "sophie", content: "Team LoL ici ✋" },
          ],
        },
        {
          name: "fps",
          messages: [
            { user: "younes", content: "CS2 c'est comment ?" },
            { user: "nadir", content: "Pas mal mais quelques bugs." },
            { user: "michael", content: "Valorant > CS, change my mind." },
            { user: "pierre", content: "Le débat sans fin..." },
            { user: "younes", content: "Qui pour une ranked Valo ?" },
            { user: "sophie", content: "Je suis Bronze, vous m'acceptez ?" },
            { user: "nadir", content: "Vasy on carry." },
            { user: "michael", content: "Je prends Sage." },
          ],
        },
        {
          name: "rpg",
          messages: [
            { user: "warith", content: "J'ai relancé Witcher 3, quel banger." },
            {
              user: "pierre",
              content: "Le DLC Blood and Wine est incroyable.",
            },
            { user: "younes", content: "Baldur's Gate 3 goty." },
            {
              user: "nadir",
              content: "J'ai 200h dessus j'ai toujours pas fini l'acte 3.",
            },
            { user: "sophie", content: "Moi je suis sur Zelda TOTK." },
            { user: "michael", content: "Elden Ring m'a brisé." },
            { user: "warith", content: "Malenia..." },
            { user: "pierre", content: "Let me solo her." },
          ],
        },
        {
          name: "setup-pics",
          messages: [
            { user: "younes", content: "Nouveau clavier reçu ! Keychron K2." },
            { user: "nadir", content: "Propre, switches brown ?" },
            { user: "younes", content: "Red, pour le gaming." },
            { user: "sophie", content: "J'adore ton tapis de souris." },
            {
              user: "michael",
              content: "Faut que je change mon écran, des conseils ?",
            },
            { user: "warith", content: "LG Ultragear, une valeur sûre." },
            { user: "pierre", content: "Ou Odyssey G7 si t'as le budget." },
            { user: "michael", content: "Je vais check ça merci." },
          ],
        },
      ],
    },
    {
      name: "Cinephiles Club",
      owner: "michael",
      members: ["emma", "thomas", "julie", "sophie", "nadir"],
      channels: [
        {
          name: "general",
          messages: [
            { user: "michael", content: "Bienvenue au club !" },
            { user: "emma", content: "Hello !" },
            { user: "julie", content: "Chouette initiative." },
            { user: "thomas", content: "On parle de quoi aujourd'hui ?" },
            { user: "sophie", content: "Les Oscars ?" },
            { user: "michael", content: "Grosse déception pour ma part." },
            { user: "emma", content: "Pareil, trop prévisible." },
            { user: "julie", content: "Au moins la réalisation était belle." },
          ],
        },
        {
          name: "recommendations",
          messages: [
            {
              user: "thomas",
              content: "Je cherche un thriller psychologique.",
            },
            { user: "michael", content: "Shutter Island, classique." },
            { user: "emma", content: "Gone Girl !" },
            { user: "sophie", content: "Prisoners de Denis Villeneuve." },
            { user: "thomas", content: "Déjà vus tous les trois..." },
            { user: "julie", content: "The Game (Fincher) ?" },
            { user: "thomas", content: "Ah non, je note." },
            { user: "michael", content: "Tu vas adorer." },
          ],
        },
        {
          name: "series",
          messages: [
            { user: "emma", content: "Succession c'est fini... 😭" },
            { user: "sophie", content: "Quelle fin magistrale." },
            { user: "julie", content: "Je viens de commencer Severance." },
            { user: "michael", content: "Incroyable cette série, l'ambiance." },
            { user: "thomas", content: "The Bear saison 2, une tuerie." },
            { user: "emma", content: "Oui !! Cousin !!" },
            { user: "michael", content: "J'ai faim à chaque épisode." },
            { user: "sophie", content: "Pareil haha." },
          ],
        },
        {
          name: "sorties-cinema",
          messages: [
            {
              user: "michael",
              content: "Qui pour aller voir le nouveau Nolan ?",
            },
            { user: "thomas", content: "Chaud ! Imax ?" },
            { user: "julie", content: "Obligé l'Imax pour Nolan." },
            { user: "emma", content: "Je suis dispo mardi." },
            { user: "sophie", content: "Moi aussi." },
            { user: "michael", content: "Vas pour mardi 20h alors." },
            { user: "thomas", content: "Je prends les places ?" },
            { user: "emma", content: "Oui stp, on te rembourse." },
          ],
        },
      ],
    },
    {
      name: "Hiking Adventures",
      owner: "pierre",
      members: ["lucas", "julie", "sophie", "thomas", "emma", "warith", "younes"],
      channels: [
        {
          name: "general",
          messages: [
            { user: "pierre", content: "Salut les randonneurs !" },
            { user: "lucas", content: "Prêts pour grimper ?" },
            { user: "julie", content: "Toujours !" },
            { user: "sophie", content: "Ça manque d'air frais ici." },
            { user: "thomas", content: "Effectivement." },
            { user: "emma", content: "J'ai besoin de voir des arbres." },
            { user: "pierre", content: "On va organiser ça." },
            { user: "lucas", content: "Yes !" },
          ],
        },
        {
          name: "sentiers",
          messages: [
            {
              user: "julie",
              content: "Des idées pour ce week-end ? Pas trop dur svp.",
            },
            {
              user: "pierre",
              content: "Le Vercors c'est sympa et accessible.",
            },
            { user: "emma", content: "Les Calanques ?" },
            { user: "thomas", content: "Trop de monde..." },
            { user: "sophie", content: "Chartreuse sinon." },
            { user: "lucas", content: "La Dent de Crolles ?" },
            {
              user: "pierre",
              content: "Un peu technique pour une reprise non ?",
            },
            { user: "julie", content: "Oui on va éviter si possible haha." },
          ],
        },
        {
          name: "matos",
          messages: [
            { user: "thomas", content: "Je dois changer mes chaussures." },
            { user: "lucas", content: "Salomon c'est la valeur sûre." },
            {
              user: "emma",
              content: "Merrell c'est bien aussi, très confort.",
            },
            {
              user: "pierre",
              content: "Prends des tiges hautes si tu fais du caillou.",
            },
            { user: "thomas", content: "Ok je note." },
            { user: "sophie", content: "Et des bons bâtons ça change la vie." },
            {
              user: "julie",
              content: "Clairement, pour les genoux en descente.",
            },
            {
              user: "thomas",
              content: "Je vais faire un tour au vieux campeur.",
            },
          ],
        },
        {
          name: "photos",
          messages: [
            {
              user: "pierre",
              content: "Petite photo de ma sortie hier au Mont Blanc.",
            },
            { user: "julie", content: "Wouah la vue !" },
            { user: "lucas", content: "Magnifique." },
            { user: "emma", content: "Ça donne envie." },
            { user: "sophie", content: "C'est beau la montagne." },
            { user: "thomas", content: "Il faisait beau en plus." },
            { user: "pierre", content: "Grand soleil oui." },
            { user: "lucas", content: "La chance." },
          ],
        },
      ],
    },
    {
      name: "Startup Nation",
      owner: "sophie",
      members: ["nadir", "warith", "lucas", "julie"],
      channels: [
        {
          name: "general",
          messages: [
            { user: "sophie", content: "Welcome founders & dreamers." },
            { user: "nadir", content: "Hello la team." },
            { user: "warith", content: "Prêts à disrupter le marché ?" },
            { user: "lucas", content: "Always." },
            { user: "julie", content: "Des événements prévus ?" },
            { user: "sophie", content: "Oui, un afterwork jeudi." },
            { user: "nadir", content: "Je serai là." },
            { user: "warith", content: "Moi aussi." },
          ],
        },
        {
          name: "ideas",
          messages: [
            {
              user: "lucas",
              content: "J'ai une idée d'app : Tinder pour les cofondateurs.",
            },
            { user: "julie", content: "Ça existe déjà non ?" },
            { user: "nadir", content: "Y Combinator a un truc comme ça." },
            { user: "lucas", content: "Ah mince." },
            {
              user: "warith",
              content: "L'exécution compte plus que l'idée 😉",
            },
            { user: "sophie", content: "Exactement." },
            { user: "lucas", content: "Je vais pivoter alors." },
            { user: "nadir", content: "Uber pour les tondeuses." },
          ],
        },
        {
          name: "funding",
          messages: [
            {
              user: "warith",
              content: "Les taux remontent, c'est dur de lever.",
            },
            { user: "sophie", content: "Faut être rentable plus vite." },
            { user: "nadir", content: "Le bootstrapping c'est la vie." },
            { user: "julie", content: "Ou la BPI ?" },
            {
              user: "lucas",
              content: "Bourse French Tech ça aide bien au début.",
            },
            { user: "warith", content: "Oui on a eu la subvention." },
            { user: "sophie", content: "Faut préparer un bon pitch deck." },
            { user: "nadir", content: "Je peux relire si vous voulez." },
          ],
        },
        {
          name: "tech-news",
          messages: [
            { user: "julie", content: "Vous avez vu la conf d'OpenAI ?" },
            { user: "lucas", content: "Sora c'est effrayant." },
            { user: "nadir", content: "Mais fascinant." },
            { user: "warith", content: "Ça va changer pas mal de métiers." },
            {
              user: "sophie",
              content: "Faut qu'on intégre l'IA dans nos produits.",
            },
            { user: "nadir", content: "C'est déjà le cas haha." },
            { user: "lucas", content: "Tout est 'AI powered' maintenant." },
            { user: "julie", content: "C'est le mot magique pour les VCs." },
          ],
        },
      ],
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

    for (const memberUsername of s.members) {
      const role = Math.random() > 0.8 ? "admin" : "member";
      await prisma.serverMember.create({
        data: {
          serverId: server.id,
          userId: users[memberUsername].id,
          role: role,
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
        createdBy: users["nadir"].id,
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
        createdBy: users["younes"].id,
        maxUses: 50,
        uses: 0,
      },
    });
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
