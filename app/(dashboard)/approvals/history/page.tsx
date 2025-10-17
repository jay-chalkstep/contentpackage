import { FileSignature } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function ApprovalHistoryPage() {
  return (
    <ComingSoon
      title="Approval History"
      description="Complete audit trail of all approval decisions. View who approved what and when, including digital signatures, timestamps, and any conditions or comments attached to each approval."
      icon={<FileSignature className="h-8 w-8 text-[#374151]" />}
    />
  );
}
