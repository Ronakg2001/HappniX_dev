import EventDetailPageClient from "./EventDetailPageClient";

export async function generateStaticParams() {
  return [
    { id: "e1" },
    { id: "e2" },
    { id: "sp1" }
  ];
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EventDetailPage({ params }: PageProps) {
  return <EventDetailPageClient params={params} />;
}
