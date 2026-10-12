import { useQuery } from "@tanstack/react-query";
import WeddingInvitation from "@/components/WeddingInvitation";
import { defaultContent } from "@/data/defaultContent";
import { apiGet } from "@/lib/api";
import type { InvitationContent } from "@/types/invitation";

export default function Home() {
  const query = useQuery({ queryKey: ["invitation"], queryFn: () => apiGet<InvitationContent>("/invitation"), retry: false });
  return <WeddingInvitation content={query.isError ? defaultContent : (query.data ?? defaultContent)} />;
}
