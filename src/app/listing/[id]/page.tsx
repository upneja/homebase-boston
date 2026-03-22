import { listings } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/ListingDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    notFound();
  }

  return <ListingDetail listing={listing} />;
}
