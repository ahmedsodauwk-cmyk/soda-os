import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageAtmosphere } from "@/components/brand/page-atmosphere";
import { SodaLogo } from "@/components/brand/soda-logo";
import { Button } from "@/components/ui/button";
import {
  ABOUT_COPY,
  getModuleSlogan,
  SODA_OPERATOR,
} from "@/lib/brand";

/**
 * About SODA VISUALS — premium brand story page.
 * Crew list awaits Founder official names — do not invent members.
 * Linked from sidebar user menu / footer — does not reshuffle main nav IA.
 */
export default function AboutPage() {
  return (
    <main
      data-soda-section="auth"
      className="soda-brand-wash relative min-h-screen overflow-hidden bg-transparent"
    >
      <PageAtmosphere section="auth" />
      <div className="relative z-[1] overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="mb-10 flex items-center justify-between gap-4">
            <SodaLogo placement="about" showWord />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-3.5" />
              Command Center
            </Button>
          </div>

          <p className="text-[11px] font-medium tracking-[0.18em] text-soda-pink uppercase">
            {ABOUT_COPY.eyebrow}
          </p>
          <h1 className="font-ar mt-3 text-3xl font-semibold leading-[1.35] tracking-tight sm:text-4xl sm:leading-[1.3]">
            {ABOUT_COPY.headline}
          </h1>
          <p
            className="font-ar mt-4 max-w-xl text-base leading-[1.85] text-muted-foreground"
            dir="rtl"
          >
            {getModuleSlogan("about")}
          </p>

          <section className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5">
              <h2 className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
                {ABOUT_COPY.missionTitle}
              </h2>
              <p
                className="font-ar text-[0.9375rem] leading-[1.85] text-foreground/90"
                dir="rtl"
              >
                {ABOUT_COPY.mission}
              </p>
            </div>
            <div className="space-y-2 rounded-2xl border border-soda-pink/25 bg-soda-pink/[0.06] p-5">
              <h2 className="font-heading text-sm font-semibold tracking-wide text-soda-pink uppercase">
                {ABOUT_COPY.visionTitle}
              </h2>
              <p
                className="font-ar text-[0.9375rem] leading-[1.85] text-foreground/90"
                dir="rtl"
              >
                {ABOUT_COPY.vision}
              </p>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {ABOUT_COPY.valuesTitle}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ABOUT_COPY.values.map((value) => (
                <div
                  key={value.title}
                  className="soda-cc-card rounded-xl border border-border/70 bg-card p-4"
                >
                  <p className="font-heading text-sm font-semibold text-primary">
                    {value.title}
                  </p>
                  <p
                    className="font-ar mt-2 text-[0.9375rem] leading-[1.8] text-muted-foreground"
                    dir="rtl"
                  >
                    {value.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {ABOUT_COPY.teamTitle}
            </h2>
            <p
              className="font-ar mt-1 text-[0.9375rem] leading-[1.8] text-muted-foreground"
              dir="rtl"
            >
              {ABOUT_COPY.teamWhisper}
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              <li className="flex items-center justify-between rounded-xl border border-soda-pink/20 bg-soda-pink/[0.05] px-4 py-3">
                <span className="font-ar text-sm font-medium" dir="rtl">
                  {SODA_OPERATOR}
                </span>
                <span className="text-xs text-muted-foreground">
                  Founder
                </span>
              </li>
              <li className="col-span-full rounded-xl border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Official crew list awaits Founder confirmation. No placeholder
                  names are shown.
                </p>
              </li>
            </ul>
          </section>

          <section className="mt-14 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center">
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              {ABOUT_COPY.partnersTitle}
            </h2>
            <p
              className="font-ar mx-auto mt-2 max-w-md text-[0.9375rem] leading-[1.8] text-muted-foreground"
              dir="rtl"
            >
              {ABOUT_COPY.partnersWhisper}
            </p>
          </section>

          <p className="mt-12 text-center text-xs tracking-[0.14em] text-muted-foreground uppercase">
            SODA VISUALS · Experience v1.0
          </p>
        </div>
      </div>
    </main>
  );
}
