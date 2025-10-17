import { Clock } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function PendingApprovalsPage() {
  return (
    <ComingSoon
      title="Pending Approvals"
      description="View assets awaiting your approval. Review feedback, check annotations, and provide digital signatures to move assets through your organization's approval workflow stages."
      icon={<Clock className="h-8 w-8 text-[#374151]" />}
    />
  );
}
