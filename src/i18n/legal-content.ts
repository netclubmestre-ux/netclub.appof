import type { Language } from "@/data/types";

/**
 * RASCUNHOS de documentos legais por idioma.
 *
 * Nada aqui é versão jurídica validada. Cada tradução precisa de revisão
 * profissional e adequação às leis locais antes de publicação.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export type LegalDocumentId = "terms" | "privacy" | "guidelines";

export const LEGAL_VERSION = "2026-01";

const content: Record<Language, Record<LegalDocumentId, LegalSection[]>> = {
  "pt-BR": {
    terms: [
      {
        heading: "1. Objeto",
        paragraphs: [
          "O NetClub é uma plataforma de networking profissional voltada a pessoas do mercado digital. A plataforma permite criar perfil, publicar conteúdo, participar de grupos, estabelecer conexões e trocar mensagens.",
          "Este documento é um rascunho e será substituído pela versão revisada juridicamente antes do lançamento.",
        ],
      },
      {
        heading: "2. Conta e responsabilidades",
        paragraphs: [
          "O usuário é responsável pelas informações que publica e pela guarda de suas credenciais. É proibido criar contas falsas, se passar por outra pessoa ou usar a plataforma para atividades ilícitas.",
          "O NetClub pode suspender ou remover conteúdos e contas que violem as Diretrizes da Comunidade ou a legislação aplicável.",
        ],
      },
      {
        heading: "3. Conteúdo e propriedade intelectual",
        paragraphs: [
          "O usuário mantém a titularidade do conteúdo que publica e concede ao NetClub licença limitada para exibir e distribuir esse conteúdo dentro da plataforma.",
          "Conteúdos de terceiros devem ser utilizados com autorização e crédito adequados.",
        ],
      },
      {
        heading: "4. Limitação de responsabilidade",
        paragraphs: [
          "O NetClub não garante resultados profissionais, comerciais ou financeiros decorrentes de conexões realizadas na plataforma.",
          "Informações do Canal Oficial têm caráter informativo e não constituem recomendação de investimento.",
        ],
      },
    ],
    privacy: [
      {
        heading: "1. Dados tratados",
        paragraphs: [
          "Tratamos dados de cadastro (nome, e-mail, nome de usuário), dados de perfil profissional informados voluntariamente, conteúdo publicado, conexões, mensagens e registros técnicos de uso.",
          "Dados sensíveis não são solicitados para o funcionamento da plataforma.",
        ],
      },
      {
        heading: "2. Finalidades e bases legais",
        paragraphs: [
          "Os dados são usados para operar a conta, personalizar recomendações, viabilizar conexões e cumprir obrigações legais. Cada finalidade deve ter base legal documentada na versão final desta política.",
          "Consentimentos específicos serão registrados separadamente, com data e versão do documento aceito.",
        ],
      },
      {
        heading: "3. Compartilhamento",
        paragraphs: [
          "Dados podem ser processados por provedores de infraestrutura, autenticação e armazenamento estritamente necessários à operação, sob contratos e medidas de segurança adequadas.",
          "Não vendemos dados pessoais.",
        ],
      },
      {
        heading: "4. Direitos do titular",
        paragraphs: [
          "O titular pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, bloqueio ou eliminação de dados, além de revogar consentimentos.",
          "As solicitações serão atendidas nos prazos legais, após verificação de identidade.",
        ],
      },
      {
        heading: "5. Retenção e segurança",
        paragraphs: [
          "Os dados são mantidos pelo tempo necessário às finalidades informadas ou por exigência legal. Controles de acesso, criptografia em trânsito e políticas de banco de dados restringem o acesso às informações.",
          "Em caso de incidente relevante, os titulares e a autoridade competente serão comunicados conforme a legislação.",
        ],
      },
    ],
    guidelines: [
      {
        heading: "1. Respeito",
        paragraphs: [
          "Não é permitido assédio, discurso de ódio, ameaça, discriminação ou exposição de dados pessoais de terceiros.",
          "Divergências profissionais são bem-vindas quando acompanhadas de argumentos e respeito.",
        ],
      },
      {
        heading: "2. Conteúdo permitido",
        paragraphs: [
          "Compartilhe conhecimento, dúvidas, experiências e oportunidades reais. Identifique conteúdo patrocinado e não publique informações enganosas.",
          "Cotações e notícias devem citar a fonte. Não é permitido prometer resultados financeiros garantidos.",
        ],
      },
      {
        heading: "3. Spam e autopromoção",
        paragraphs: [
          "Autopromoção é permitida com contexto e moderação. Mensagens repetidas, links abusivos e abordagens não solicitadas podem ser limitados.",
        ],
      },
      {
        heading: "4. Moderação",
        paragraphs: [
          "Denúncias são analisadas pela equipe. Conteúdos podem ser removidos, contas suspensas e recursos restringidos, com registro das ações.",
          "É possível recorrer das decisões pelo canal de contato.",
        ],
      },
    ],
  },
  en: {
    terms: [
      {
        heading: "1. Purpose",
        paragraphs: [
          "NetClub is a professional networking platform for people in the digital market. It allows users to create a profile, publish content, join groups, establish connections and exchange messages.",
          "This document is a draft and will be replaced by a legally reviewed version before launch.",
        ],
      },
      {
        heading: "2. Account and responsibilities",
        paragraphs: [
          "Users are responsible for the information they publish and for keeping their credentials safe. Fake accounts, impersonation and unlawful use are prohibited.",
          "NetClub may suspend or remove content and accounts that violate the Community Guidelines or applicable law.",
        ],
      },
      {
        heading: "3. Content and intellectual property",
        paragraphs: [
          "Users retain ownership of the content they publish and grant NetClub a limited license to display and distribute it within the platform.",
          "Third-party content must be used with proper authorization and credit.",
        ],
      },
      {
        heading: "4. Limitation of liability",
        paragraphs: [
          "NetClub does not guarantee professional, commercial or financial results from connections made on the platform.",
          "Official Channel information is informative and does not constitute investment advice.",
        ],
      },
    ],
    privacy: [
      {
        heading: "1. Data we process",
        paragraphs: [
          "We process registration data (name, email, username), professional profile data voluntarily provided, published content, connections, messages and technical usage logs.",
          "Sensitive data is not requested for the platform to operate.",
        ],
      },
      {
        heading: "2. Purposes and legal bases",
        paragraphs: [
          "Data is used to operate the account, personalize recommendations, enable connections and comply with legal obligations. Each purpose must have a documented legal basis in the final version of this policy.",
          "Specific consents will be recorded separately, with date and accepted document version.",
        ],
      },
      {
        heading: "3. Sharing",
        paragraphs: [
          "Data may be processed by infrastructure, authentication and storage providers strictly necessary for operation, under adequate contracts and security measures.",
          "We do not sell personal data.",
        ],
      },
      {
        heading: "4. Data subject rights",
        paragraphs: [
          "Users may request confirmation of processing, access, correction, portability, anonymization, blocking or deletion of data, and may withdraw consent.",
          "Requests are handled within legal deadlines after identity verification.",
        ],
      },
      {
        heading: "5. Retention and security",
        paragraphs: [
          "Data is kept for the time required by the informed purposes or by law. Access controls, encryption in transit and database policies restrict access.",
          "In case of a relevant incident, users and the competent authority will be notified as required by law.",
        ],
      },
    ],
    guidelines: [
      {
        heading: "1. Respect",
        paragraphs: [
          "Harassment, hate speech, threats, discrimination and exposure of third-party personal data are not allowed.",
          "Professional disagreement is welcome when supported by arguments and respect.",
        ],
      },
      {
        heading: "2. Allowed content",
        paragraphs: [
          "Share knowledge, questions, experiences and real opportunities. Identify sponsored content and do not publish misleading information.",
          "Quotes and news must cite the source. Guaranteed financial results must not be promised.",
        ],
      },
      {
        heading: "3. Spam and self-promotion",
        paragraphs: [
          "Self-promotion is allowed with context and moderation. Repeated messages, abusive links and unsolicited outreach may be limited.",
        ],
      },
      {
        heading: "4. Moderation",
        paragraphs: [
          "Reports are reviewed by the team. Content may be removed, accounts suspended and features restricted, with actions logged.",
          "Decisions can be appealed through the contact channel.",
        ],
      },
    ],
  },
  es: {
    terms: [
      {
        heading: "1. Objeto",
        paragraphs: [
          "NetClub es una plataforma de networking profesional para personas del mercado digital. Permite crear un perfil, publicar contenido, participar en grupos, establecer conexiones e intercambiar mensajes.",
          "Este documento es un borrador y será sustituido por la versión revisada jurídicamente antes del lanzamiento.",
        ],
      },
      {
        heading: "2. Cuenta y responsabilidades",
        paragraphs: [
          "El usuario es responsable de la información que publica y de proteger sus credenciales. Se prohíben cuentas falsas, suplantación de identidad y uso ilícito.",
          "NetClub puede suspender o eliminar contenidos y cuentas que violen las Directrices de la Comunidad o la legislación aplicable.",
        ],
      },
      {
        heading: "3. Contenido y propiedad intelectual",
        paragraphs: [
          "El usuario conserva la titularidad del contenido que publica y concede a NetClub una licencia limitada para mostrarlo y distribuirlo dentro de la plataforma.",
          "Los contenidos de terceros deben usarse con autorización y crédito adecuados.",
        ],
      },
      {
        heading: "4. Limitación de responsabilidad",
        paragraphs: [
          "NetClub no garantiza resultados profesionales, comerciales o financieros derivados de las conexiones realizadas en la plataforma.",
          "La información del Canal Oficial es informativa y no constituye recomendación de inversión.",
        ],
      },
    ],
    privacy: [
      {
        heading: "1. Datos tratados",
        paragraphs: [
          "Tratamos datos de registro (nombre, correo, usuario), datos de perfil profesional proporcionados voluntariamente, contenido publicado, conexiones, mensajes y registros técnicos de uso.",
          "No se solicitan datos sensibles para el funcionamiento de la plataforma.",
        ],
      },
      {
        heading: "2. Finalidades y bases legales",
        paragraphs: [
          "Los datos se usan para operar la cuenta, personalizar recomendaciones, permitir conexiones y cumplir obligaciones legales. Cada finalidad debe tener base legal documentada en la versión final.",
          "Los consentimientos específicos se registrarán por separado, con fecha y versión del documento aceptado.",
        ],
      },
      {
        heading: "3. Compartición",
        paragraphs: [
          "Los datos pueden ser procesados por proveedores de infraestructura, autenticación y almacenamiento estrictamente necesarios, bajo contratos y medidas de seguridad adecuadas.",
          "No vendemos datos personales.",
        ],
      },
      {
        heading: "4. Derechos del titular",
        paragraphs: [
          "El titular puede solicitar confirmación del tratamiento, acceso, corrección, portabilidad, anonimización, bloqueo o eliminación de datos, además de revocar consentimientos.",
          "Las solicitudes se atienden en los plazos legales tras verificar la identidad.",
        ],
      },
      {
        heading: "5. Retención y seguridad",
        paragraphs: [
          "Los datos se conservan el tiempo necesario para las finalidades informadas o por exigencia legal. Controles de acceso, cifrado en tránsito y políticas de base de datos restringen el acceso.",
          "En caso de incidente relevante, se notificará a los titulares y a la autoridad competente según la ley.",
        ],
      },
    ],
    guidelines: [
      {
        heading: "1. Respeto",
        paragraphs: [
          "No se permite acoso, discurso de odio, amenazas, discriminación ni exposición de datos personales de terceros.",
          "Las diferencias profesionales son bienvenidas cuando hay argumentos y respeto.",
        ],
      },
      {
        heading: "2. Contenido permitido",
        paragraphs: [
          "Comparte conocimiento, dudas, experiencias y oportunidades reales. Identifica el contenido patrocinado y no publiques información engañosa.",
          "Las cotizaciones y noticias deben citar la fuente. No se permite prometer resultados financieros garantizados.",
        ],
      },
      {
        heading: "3. Spam y autopromoción",
        paragraphs: [
          "La autopromoción se permite con contexto y moderación. Los mensajes repetidos, enlaces abusivos y contactos no solicitados pueden limitarse.",
        ],
      },
      {
        heading: "4. Moderación",
        paragraphs: [
          "Las denuncias son revisadas por el equipo. Se pueden eliminar contenidos, suspender cuentas y restringir funciones, con registro de las acciones.",
          "Las decisiones pueden apelarse por el canal de contacto.",
        ],
      },
    ],
  },
};

export function getLegalSections(language: Language, document: LegalDocumentId): LegalSection[] {
  return content[language][document];
}
