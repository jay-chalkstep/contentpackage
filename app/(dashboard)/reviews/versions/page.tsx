import { GitBranch } from 'lucide-react';
import ComingSoon from '@/components/ComingSoon';

export default function VersionHistoryPage() {
  return (
    <ComingSoon
      title="Version History"
      description="Track the complete evolution of your assets. Compare versions side-by-side, restore previous iterations, and maintain a complete audit trail of all changes and revisions."
      icon={<GitBranch className="h-8 w-8 text-[#374151]" />}
    />
  );
}
