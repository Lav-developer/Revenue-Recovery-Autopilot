import { CaseDetailPage } from "@/components/cases/case-detail-page";
export default async function CaseDetailRoute({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <CaseDetailPage id={id} />; }
