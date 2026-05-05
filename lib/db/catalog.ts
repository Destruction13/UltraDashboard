/**
 * First-wave linked service catalog declared in the V1 spec.
 *
 * This file is intentionally framework-free so it can be imported from server
 * code, seed scripts, and shared validators. The shape mirrors the
 * `instruction_documents.content_json` schema in the spec.
 */

export type InstructionBlock =
  | { type: "overview"; text: string }
  | { type: "steps"; items: ReadonlyArray<{ title: string; body: string }> }
  | { type: "tips"; items: ReadonlyArray<string> }
  | { type: "warnings"; items: ReadonlyArray<string> }
  | { type: "links"; items: ReadonlyArray<{ label: string; url: string }> };

export type InstructionDocumentContent = {
  version: 1;
  blocks: ReadonlyArray<InstructionBlock>;
};

export type LinkedServiceCatalogEntry = {
  slug: "chatgpt" | "codex" | "github" | "devin";
  serviceName: string;
  defaultLoginUrl: string;
  defaultInstructionTitle: string;
  defaultInstructionSummary: string;
  defaultContent: InstructionDocumentContent;
};

export const LINKED_SERVICE_CATALOG: ReadonlyArray<LinkedServiceCatalogEntry> = [
  {
    slug: "chatgpt",
    serviceName: "ChatGPT",
    defaultLoginUrl: "https://chatgpt.com/",
    defaultInstructionTitle: "Use this account in ChatGPT",
    defaultInstructionSummary:
      "How operators and agents should consume this ChatGPT login.",
    defaultContent: {
      version: 1,
      blocks: [
        { type: "overview", text: "Sign into ChatGPT for the linked root account." },
        {
          type: "steps",
          items: [
            {
              title: "Open login page",
              body: "Open https://chatgpt.com/ in a fresh browser profile.",
            },
            {
              title: "Use stored credentials",
              body: "Copy the login and password from the left panel.",
            },
            {
              title: "Provide the current OTP",
              body: "Use the TOTP code shown in the credentials panel.",
            },
          ],
        },
        {
          type: "tips",
          items: ["Prefer fresh browser profiles per agent to avoid session collisions."],
        },
      ],
    },
  },
  {
    slug: "codex",
    serviceName: "Codex",
    defaultLoginUrl: "https://chatgpt.com/codex",
    defaultInstructionTitle: "Use this account in Codex",
    defaultInstructionSummary:
      "Operating notes for the Codex coding-agent surface attached to this root account.",
    defaultContent: {
      version: 1,
      blocks: [
        { type: "overview", text: "Codex login bound to the linked root identity." },
        {
          type: "steps",
          items: [
            { title: "Open Codex", body: "Use the stored login URL." },
            {
              title: "Sign in",
              body: "Use the credentials and OTP from the left panel.",
            },
          ],
        },
      ],
    },
  },
  {
    slug: "github",
    serviceName: "GitHub",
    defaultLoginUrl: "https://github.com/login",
    defaultInstructionTitle: "Use this GitHub account",
    defaultInstructionSummary:
      "Operating notes for human and agent use of this GitHub identity.",
    defaultContent: {
      version: 1,
      blocks: [
        {
          type: "overview",
          text: "GitHub identity used for repos, agent integrations, and OmniRoute providers.",
        },
        {
          type: "steps",
          items: [
            { title: "Open login page", body: "Use https://github.com/login." },
            { title: "Provide the OTP", body: "Use the TOTP code shown on the left." },
          ],
        },
        {
          type: "tips",
          items: ["Personal access tokens belong in notes, not in roadmap blocks."],
        },
      ],
    },
  },
  {
    slug: "devin",
    serviceName: "Devin",
    defaultLoginUrl: "https://app.devin.ai/login",
    defaultInstructionTitle: "Use this account in Devin",
    defaultInstructionSummary:
      "How to attach this root identity to Devin and pass it to internal agents.",
    defaultContent: {
      version: 1,
      blocks: [
        {
          type: "overview",
          text: "Devin login bound to the linked root identity for shared agent runs.",
        },
        {
          type: "steps",
          items: [
            { title: "Open Devin", body: "Use https://app.devin.ai/login." },
            {
              title: "Sign in via the linked provider",
              body: "Use the stored credentials and OTP.",
            },
          ],
        },
      ],
    },
  },
];

export const FAMILY_SEEDS = [
  {
    slug: "github",
    name: "GitHub",
    description:
      "Root identities used to register and manage GitHub-based services.",
    sortOrder: 10,
  },
  {
    slug: "google",
    name: "Google",
    description: "Google identities used as the parent for ChatGPT, Devin, and others.",
    sortOrder: 20,
  },
  {
    slug: "zoho",
    name: "Zoho",
    description: "Zoho identities used as alias mailboxes for service registration.",
    sortOrder: 30,
  },
] as const;
