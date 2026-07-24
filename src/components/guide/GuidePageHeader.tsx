import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Icon from "@/components/Icon";
import SectionHeader from "@/components/ui/SectionHeader";
import GuideTile from "@/components/guide/GuideTile";
import { guideSection, type GuideSlug } from "@/lib/guideSections";

/** Detail-page header: back link to the guide index + the one h1. */
export default function GuidePageHeader({ slug }: { slug: GuideSlug }) {
  const section = guideSection(slug);
  return (
    <>
      <Link
        href="/guide"
        className="inline-flex min-h-control items-center gap-0.5 text-callout font-semibold text-link"
      >
        <Icon icon={ChevronLeft} size="sm" /> Guide
      </Link>
      <SectionHeader
        level={1}
        eyebrow="Field guide"
        tile={<GuideTile slug={slug} />}
        title={section.heading}
      />
    </>
  );
}
