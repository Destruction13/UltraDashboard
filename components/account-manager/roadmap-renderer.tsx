import { AlertTriangle, ExternalLink, Lightbulb, ListChecks, Sparkles } from "lucide-react";

import { GlassPanel } from "@/components/shell/glass-panel";
import { SectionHeader } from "@/components/shell/section-header";
import { Badge } from "@/components/ui/badge";
import type { InstructionDocumentContent } from "@/lib/db/catalog";

export function RoadmapRenderer({
  title,
  summary,
  content,
}: {
  title: string;
  summary: string;
  content: InstructionDocumentContent;
}) {
  return (
    <GlassPanel className="flex flex-col gap-5 p-6 sm:p-7">
      <SectionHeader
        eyebrow="Roadmap"
        title={title}
        description={summary}
        actions={<Badge variant="violet">Structured</Badge>}
      />

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        {content.blocks.map((block, index) => {
          switch (block.type) {
            case "overview":
              return (
                <section key={`${block.type}-${index}`} className="rounded-xl border border-border/60 bg-background/35 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75">
                    <Sparkles className="h-3.5 w-3.5" />
                    Overview
                  </div>
                  <p>{block.text}</p>
                </section>
              );

            case "steps":
              return (
                <section key={`${block.type}-${index}`} className="rounded-xl border border-border/60 bg-background/35 p-4">
                  <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75">
                    <ListChecks className="h-3.5 w-3.5" />
                    Steps
                  </div>
                  <ol className="grid gap-3">
                    {block.items.map((item, stepIndex) => (
                      <li key={`${item.title}-${stepIndex}`} className="grid gap-1 rounded-lg border border-border/50 bg-background/40 px-3 py-3">
                        <span className="text-sm font-semibold text-foreground">
                          {stepIndex + 1}. {item.title}
                        </span>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              );

            case "tips":
              return (
                <section key={`${block.type}-${index}`} className="rounded-xl border border-[hsl(var(--tag-emerald)/0.35)] bg-[hsl(var(--tag-emerald)/0.08)] p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--tag-emerald))]">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Tips
                  </div>
                  <ul className="grid gap-2 text-xs leading-relaxed text-foreground/85">
                    {block.items.map((item, tipIndex) => (
                      <li key={`${item}-${tipIndex}`}>• {item}</li>
                    ))}
                  </ul>
                </section>
              );

            case "warnings":
              return (
                <section key={`${block.type}-${index}`} className="rounded-xl border border-[hsl(var(--tag-rose)/0.35)] bg-[hsl(var(--tag-rose)/0.08)] p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--tag-rose))]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Warnings
                  </div>
                  <ul className="grid gap-2 text-xs leading-relaxed text-foreground/85">
                    {block.items.map((item, warningIndex) => (
                      <li key={`${item}-${warningIndex}`}>• {item}</li>
                    ))}
                  </ul>
                </section>
              );

            case "links":
              return (
                <section key={`${block.type}-${index}`} className="rounded-xl border border-border/60 bg-background/35 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/75">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Links
                  </div>
                  <ul className="grid gap-2 text-xs">
                    {block.items.map((item, linkIndex) => (
                      <li key={`${item.label}-${linkIndex}`}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                        >
                          {item.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
          }
        })}
      </div>
    </GlassPanel>
  );
}
