import Link from "next/link";
import Nav from "@/components/Nav";
import SectionEyebrow from "@/components/SectionEyebrow";
import GalleryGrid from "@/components/GalleryGrid";
import { getSiteContent } from "@/lib/content";

export const metadata = {
  title: "Photo Gallery | ST Global Forwarding",
  description:
    "A look at ST Global Forwarding's warehouses, offices, and team across Dhaka and Chittagong.",
};

export default async function GalleryPage() {
  const content = await getSiteContent();
  const { heading, intro, images } = content.gallery;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Nav />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14 md:pt-20">
        <SectionEyebrow>Gallery</SectionEyebrow>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {heading}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/65">{intro}</p>

        <div className="mt-10">
          <GalleryGrid images={images} />
        </div>

        <div className="mt-14 border-t border-line pt-8 text-sm text-ink/50">
          Want to see your shipment in motion?{" "}
          <Link href="/tracking" className="font-medium text-royal hover:underline">
            Track a booking
          </Link>{" "}
          or{" "}
          <Link href="/booking" className="font-medium text-royal hover:underline">
            book a new one
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
