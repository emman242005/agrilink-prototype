import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      nav_register_mfi: "Register as an MFI",
      nav_login: "Log in",
      nav_signup: "Sign up",

      hero_kicker: "Digital lending platform",
      hero_title: "Connecting Cameroon's farmers to credit",
      hero_body: "AgriLink helps smallholder farmers get verified, apply for loans, and receive funds through mobile money, while giving microfinance institutions the tools to review, score, and approve with confidence.",
      hero_apply: "Apply for a loan",
      hero_register_mfi: "Register as an MFI",
      hero_have_account: "I already have an account",

      trust_gps: "GPS-verified farms",
      trust_esign: "E-signed agreements",
      trust_momo: "Mobile money payouts",
      trust_audit: "Full audit trail",

      how_kicker: "How it works",
      how_title: "From application to funded, in one place",
      how_1_title: "Verify your identity",
      how_1_body: "Submit your documents once, reviewed securely by your lending partner.",
      how_2_title: "Apply for a loan",
      how_2_body: "A guided application with GPS farm verification and instant terms.",
      how_3_title: "Sign your agreement",
      how_3_body: "Review and e-sign your loan terms before any funds move.",
      how_4_title: "Get paid, repay easily",
      how_4_body: "Funds and repayments move through your mobile money account.",

      farmers_kicker: "For farmers",
      farmers_title: "A clear path to formal credit",
      farmers_1: "Apply from your phone, no branch visit required",
      farmers_2: "Upload land documents and ID once, reused for every application",
      farmers_3: "See your exact repayment schedule before you sign anything",
      farmers_4: "Receive funds directly to your mobile money account",
      farmers_cta: "Apply as a farmer",

      mfis_kicker: "For microfinance institutions",
      mfis_title: "Reach more farmers, with less risk",
      mfis_1: "Register your institution and get access once approved",
      mfis_2: "Document-backed KYC with an inline review workspace",
      mfis_3: "Alternative credit scoring built from land, guarantors, and cooperative data",
      mfis_4: "Set your own rates and terms, disbursement and repayment tracked automatically",
      mfis_cta: "Register as an MFI",

      security_kicker: "Security & compliance",
      security_title: "Built with trust in mind",
      security_1_title: "Alternative credit scoring",
      security_1_body: "Ten weighted factors, land ownership, guarantors, cooperative membership, and more, give lenders a real risk signal without formal credit history.",
      security_2_title: "Dual e-signature",
      security_2_body: "Every loan is signed by the farmer first, then countersigned by a loan officer before funds are ever released.",
      security_3_title: "Role-based access",
      security_3_body: "Farmers, MFI officers, and AgriLink each see only what they're authorized to. Every decision is timestamped.",

      final_title: "Ready to get started?",
      final_body: "Create your account, whether you're a farmer or a lending institution.",
      final_farmer: "Sign up as a farmer",
      final_mfi: "Register as an MFI",
      final_login: "Log in",

      footer_tag: "AGRILINK · CONNECTING FARMERS TO CREDIT",

      choice_login_title: "Log in",
      choice_login_sub: "Choose how you'd like to continue",
      choice_signup_title: "Create an account",
      choice_signup_sub: "Choose how you'd like to join",
      choice_farmer_title: "I'm a farmer",
      choice_farmer_login_sub: "Log in to apply for or manage a loan",
      choice_farmer_signup_sub: "Apply for a loan through your MFI",
      choice_mfi_title: "I'm an MFI",
      choice_mfi_login_sub: "Log in to your lending dashboard",
      choice_mfi_signup_sub: "Register your institution as a lending partner",
      choice_back_home: "Back to home",
    },
  },
  fr: {
    translation: {
      nav_register_mfi: "Inscrire un EMF",
      nav_login: "Se connecter",
      nav_signup: "S'inscrire",

      hero_kicker: "Plateforme de prêt numérique",
      hero_title: "Connecter les agriculteurs du Cameroun au crédit",
      hero_body: "AgriLink aide les petits agriculteurs à se faire vérifier, à demander des prêts et à recevoir des fonds par mobile money, tout en donnant aux établissements de microfinance les outils pour examiner, évaluer et approuver en toute confiance.",
      hero_apply: "Demander un prêt",
      hero_register_mfi: "Inscrire un EMF",
      hero_have_account: "J'ai déjà un compte",

      trust_gps: "Fermes vérifiées par GPS",
      trust_esign: "Accords signés électroniquement",
      trust_momo: "Paiements par mobile money",
      trust_audit: "Historique complet des opérations",

      how_kicker: "Comment ça marche",
      how_title: "De la demande au financement, en un seul endroit",
      how_1_title: "Vérifiez votre identité",
      how_1_body: "Soumettez vos documents une seule fois, examinés en toute sécurité par votre partenaire prêteur.",
      how_2_title: "Demandez un prêt",
      how_2_body: "Une demande guidée avec vérification GPS de la ferme et conditions instantanées.",
      how_3_title: "Signez votre accord",
      how_3_body: "Consultez et signez électroniquement les conditions de votre prêt avant tout transfert de fonds.",
      how_4_title: "Soyez payé, remboursez facilement",
      how_4_body: "Les fonds et les remboursements passent par votre compte mobile money.",

      farmers_kicker: "Pour les agriculteurs",
      farmers_title: "Un chemin clair vers le crédit formel",
      farmers_1: "Faites votre demande depuis votre téléphone, aucune visite en agence nécessaire",
      farmers_2: "Téléversez vos documents fonciers et votre pièce d'identité une seule fois, réutilisés pour chaque demande",
      farmers_3: "Consultez votre échéancier de remboursement exact avant de signer quoi que ce soit",
      farmers_4: "Recevez les fonds directement sur votre compte mobile money",
      farmers_cta: "Demander en tant qu'agriculteur",

      mfis_kicker: "Pour les établissements de microfinance",
      mfis_title: "Atteignez plus d'agriculteurs, avec moins de risque",
      mfis_1: "Inscrivez votre établissement et obtenez l'accès une fois approuvé",
      mfis_2: "KYC appuyé par documents avec un espace d'examen intégré",
      mfis_3: "Notation de crédit alternative basée sur les terres, les garants et les données coopératives",
      mfis_4: "Fixez vos propres taux et conditions, décaissement et remboursement suivis automatiquement",
      mfis_cta: "Inscrire un EMF",

      security_kicker: "Sécurité et conformité",
      security_title: "Conçu avec la confiance à l'esprit",
      security_1_title: "Notation de crédit alternative",
      security_1_body: "Dix facteurs pondérés, propriété foncière, garants, adhésion coopérative, et plus, donnent aux prêteurs un vrai signal de risque sans historique de crédit formel.",
      security_2_title: "Double signature électronique",
      security_2_body: "Chaque prêt est signé d'abord par l'agriculteur, puis contresigné par un agent de crédit avant tout décaissement.",
      security_3_title: "Accès basé sur les rôles",
      security_3_body: "Les agriculteurs, les agents des EMF et AgriLink ne voient chacun que ce qu'ils sont autorisés à voir. Chaque décision est horodatée.",

      final_title: "Prêt à commencer ?",
      final_body: "Créez votre compte, que vous soyez agriculteur ou établissement prêteur.",
      final_farmer: "S'inscrire en tant qu'agriculteur",
      final_mfi: "Inscrire un EMF",
      final_login: "Se connecter",

      footer_tag: "AGRILINK · CONNECTER LES AGRICULTEURS AU CRÉDIT",

      choice_login_title: "Se connecter",
      choice_login_sub: "Choisissez comment continuer",
      choice_signup_title: "Créer un compte",
      choice_signup_sub: "Choisissez comment vous inscrire",
      choice_farmer_title: "Je suis agriculteur",
      choice_farmer_login_sub: "Connectez-vous pour demander ou gérer un prêt",
      choice_farmer_signup_sub: "Demandez un prêt via votre EMF",
      choice_mfi_title: "Je suis un EMF",
      choice_mfi_login_sub: "Connectez-vous à votre tableau de bord de prêt",
      choice_mfi_signup_sub: "Inscrivez votre établissement en tant que partenaire prêteur",
      choice_back_home: "Retour à l'accueil",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("agrilink_lang") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;